#!/usr/bin/env bash
#
# Publish a build onto the `gh-pages` branch, one directory per git branch.
#
#     scripts/publish.sh slug   <ref>          # print the directory a ref owns
#     scripts/publish.sh put    <ref> <dir>    # publish <dir> as that ref
#     scripts/publish.sh remove <ref>          # withdraw a deleted branch
#
# `main` owns the site root; every other branch owns `b/<slug>/`. The two cases
# are deliberately not symmetric — the root is the thing you send somebody a
# link to, and a build you have to know a slug for is a build nobody opens.
#
# Why a script and not three inline `run:` blocks: the publish is a
# read-modify-write of a branch that holds *other* builds, and the failure mode
# of getting it wrong is deleting somebody's preview. That is worth being able
# to read in one place, and worth being able to run by hand.
#
# Requires GH_TOKEN with contents:write for `put` and `remove`.
set -euo pipefail

WORK=$(mktemp -d)
trap 'rm -rf "$WORK"' EXIT

# The branch that owns the root. Kept as a name rather than "the default
# branch", because which branch is default is a repo setting and this is a
# claim about the site.
ROOT_BRANCH=main

# ---------------------------------------------------------------------------

# The directory a ref owns, relative to the site root. "." means the root.
#
# `claude/` is stripped because every branch here has it and a prefix carried by
# everything distinguishes nothing. What is left is flattened to one path
# segment: a slash would nest, and two branches nesting into each other is how
# one build eats another.
slug_of() {
  local ref=${1#refs/heads/}
  [ "$ref" = "$ROOT_BRANCH" ] && { printf '.'; return; }
  ref=${ref#claude/}
  printf '%s' "$ref" | tr -c 'A-Za-z0-9._-' '-' | tr -s '-' | sed 's/^-//; s/-$//'
}

# Clone the published site into $WORK/site, or start one if there is none yet.
#
# `SITE_REMOTE` exists so this can be pointed at a scratch repository and run
# for real — the read-modify-write is the part worth rehearsing, and rehearsing
# it in CI means rehearsing it on the live site.
checkout_site() {
  local url=${SITE_REMOTE:-"https://x-access-token:${GH_TOKEN}@github.com/${GITHUB_REPOSITORY}.git"}
  SITE_URL=$url
  if git clone --quiet --depth 1 --branch gh-pages "$url" "$WORK/site" 2>/dev/null; then
    :
  else
    echo "no gh-pages branch yet — starting one"
    mkdir -p "$WORK/site"
    git -C "$WORK/site" init --quiet -b gh-pages
    git -C "$WORK/site" remote add origin "$url"
  fi
  git -C "$WORK/site" config user.name "github-actions[bot]"
  git -C "$WORK/site" config user.email \
    "41898282+github-actions[bot]@users.noreply.github.com"
}

# Drop any `b/<slug>` whose branch no longer exists.
#
# The `delete` event is not a reliable broom, and finding that out cost nothing
# only because it was found before it mattered. Runs share the `pages`
# concurrency group, and GitHub keeps exactly **one** pending run per group — so
# deleting three branches at once queues three cleanups and cancels two of them.
# Those two directories would then be orphaned for ever, because nothing else
# was ever going to look.
#
# So the delete event is an *optimisation* — it makes removal instant — and this
# is the mechanism. Every publish re-checks, which means the site converges on
# the truth no matter how many events were dropped.
#
# **Fails safe, deliberately.** A failed or empty `ls-remote` means *the answer
# is unknown*, which is not the same as *there are no branches* — and confusing
# the two would delete every preview on the site the first time the network
# hiccuped. Unknown leaves `b/` exactly as it found it.
#
# `$2` is the slug being published right now, and it is never pruned. Pruning
# runs *after* the copy, so without this the branch that just triggered the
# build can have its own directory deleted a second after writing it, if
# `ls-remote` does not name it. In CI it always does — the push landed before
# the run started — but "always" is doing load-bearing work in that sentence,
# and the failure is silent and total: a green run that publishes nothing.
# (This is the one divergence from the `laborsim` original.)
prune_orphans() {
  local site=$1 keep=${2:-} refs live slug
  if ! refs=$(git ls-remote --heads "$SITE_URL" 2>/dev/null) || [ -z "$refs" ]; then
    echo "could not list branches — leaving b/ alone"
    return
  fi

  # `case`/`continue` rather than a `&&` chain: a `while` loop exits with the
  # status of its *last* iteration, so a chain that ends in a failed test makes
  # the whole command substitution non-zero and `set -e` kills the script —
  # silently, with exit 1 and nothing printed. It survived only because `main`
  # happens to sort after `gh-pages`.
  live=$(printf '%s\n' "$refs" | sed 's|.*refs/heads/||' | while read -r ref; do
    case "$ref" in "" | gh-pages) continue ;; esac
    slug_of "$ref"
    echo
  done)

  # Empty after filtering is *also* unknown, not "no branches exist". `main`
  # publishes the root, so it is always in this list; an empty one means the
  # listing did not mean what we think it means, and the safe reading of a
  # sentence you cannot parse is to do nothing.
  if [ -z "$live" ]; then
    echo "branch list came back empty — leaving b/ alone"
    return
  fi

  for dir in "$site"/b/*/; do
    [ -d "$dir" ] || continue
    slug=$(basename "$dir")
    # spelled out rather than `[ ... ] && continue`, for the reason above
    if [ "$slug" = "$keep" ]; then continue; fi
    if ! printf '%s\n' "$live" | grep -qxF "$slug"; then
      echo "pruning $slug — the branch is gone"
      rm -rf "$dir"
    fi
  done
}

# Rewrite `b/index.html` from whatever is actually on disk.
#
# Generated rather than appended to, so it cannot claim a build that is no
# longer there. Each directory carries a `.build` line written at publish time;
# a directory without one still gets listed, because a link that works matters
# more than a date.
write_index() {
  local site=$1 rows="" slug line
  mkdir -p "$site/b"
  for dir in "$site"/b/*/; do
    [ -d "$dir" ] || continue
    slug=$(basename "$dir")
    line=$(cat "$dir/.build" 2>/dev/null || echo "&mdash;")
    rows="$rows      <li><a href=\"./$slug/\">$slug</a><span>$line</span></li>"$'\n'
  done
  [ -n "$rows" ] || rows='      <li class="none">Nothing published. Push a branch.</li>'$'\n'

  cat > "$site/b/index.html" <<HTML
<!doctype html>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Robby &amp; Funke — branch builds</title>
<style>
  :root { color-scheme: light dark; }
  body {
    margin: 0; padding: 2rem 1.25rem; font: 15px/1.5 ui-monospace, monospace;
    background: Canvas; color: CanvasText;
  }
  h1 { font-size: 1rem; letter-spacing: .12em; text-transform: uppercase; margin: 0 0 .25rem; }
  p.lede { margin: 0 0 1.75rem; opacity: .65; max-width: 34rem; }
  ul { list-style: none; margin: 0; padding: 0; max-width: 34rem; }
  li { display: flex; flex-wrap: wrap; gap: .5rem 1rem; align-items: baseline;
       justify-content: space-between; padding: .7rem 0;
       border-top: 1px solid color-mix(in srgb, CanvasText 18%, transparent); }
  li.none { opacity: .6; }
  a { color: inherit; font-weight: 600; text-decoration-thickness: 1px;
      text-underline-offset: 3px; }
  span { opacity: .55; font-size: .8125rem; }
  footer { margin-top: 2rem; opacity: .55; font-size: .8125rem; }
</style>
<h1>Branch builds</h1>
<p class="lede">
  One directory per branch, published by CI when the checks pass.
  <a href="../">main is at the root</a>.
</p>
<ul>
$rows</ul>
<footer>Removed automatically when the branch is deleted.</footer>
HTML
}

# Commit and push, or say plainly that nothing changed. A no-op push on a
# docs-only commit is not a failure and must not read as one.
publish() {
  local site=$1 message=$2
  git -C "$site" add --all
  if git -C "$site" diff --cached --quiet; then
    echo "site unchanged — nothing to push"
    return
  fi
  git -C "$site" commit --quiet -m "$message"
  git -C "$site" push --quiet origin gh-pages
  echo "pushed: $message"
}

# ---------------------------------------------------------------------------

case "${1:-}" in
  slug)
    slug_of "${2:?ref required}"
    ;;

  put)
    ref=${2:?ref required}
    from=${3:?build directory required}
    slug=$(slug_of "$ref")
    checkout_site
    site=$WORK/site

    if [ "$slug" = "." ]; then
      # Everything at the root belongs to this build — except `b/`, which
      # belongs to the other branches and is not ours to throw away.
      find "$site" -mindepth 1 -maxdepth 1 \
        ! -name .git ! -name b -exec rm -rf {} +
      cp -r "$from/." "$site/"
      target=$site
    else
      rm -rf "${site:?}/b/$slug"
      mkdir -p "$site/b/$slug"
      cp -r "$from/." "$site/b/$slug/"
      target=$site/b/$slug
    fi

    # Pages runs Jekyll over a branch source unless told not to, and Jekyll
    # hides directories beginning with an underscore.
    touch "$site/.nojekyll"

    # Stamped from the *commit*, never from the clock: re-running a workflow on
    # an unchanged commit then produces an unchanged site, and the "nothing to
    # push" path below is a real path rather than something that can never
    # happen. A gh-pages history where every entry is a real change is one you
    # can read.
    printf '%s · %s' \
      "$(git rev-parse --short HEAD 2>/dev/null || echo "${GITHUB_SHA:0:7}")" \
      "$(git log -1 --date=format:'%Y-%m-%d %H:%M' --format=%cd 2>/dev/null || echo '?')" \
      > "$target/.build"

    prune_orphans "$site" "$slug"
    write_index "$site"
    publish "$site" "Publish ${ref#refs/heads/} to ${slug}"
    ;;

  remove)
    ref=${2:?ref required}
    slug=$(slug_of "$ref")
    if [ "$slug" = "." ]; then
      echo "refusing to withdraw the site root"
      exit 0
    fi
    checkout_site
    site=$WORK/site
    if [ ! -d "$site/b/$slug" ]; then
      echo "nothing published for $slug"
      exit 0
    fi
    rm -rf "${site:?}/b/$slug"
    write_index "$site"
    publish "$site" "Withdraw ${ref#refs/heads/}"
    ;;

  *)
    echo "usage: $0 slug <ref> | put <ref> <dir> | remove <ref>" >&2
    exit 2
    ;;
esac
