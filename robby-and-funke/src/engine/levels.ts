import type { Chapter, Level } from './types'

/**
 * World 1 — The Lab. Robby's home, and the reason every room has exactly one
 * way through it: the place is full of his stuff. Path navigation only. The
 * curve teaches corners first, then splits, then both together.
 */
const lab: Chapter = {
  id: 'lab',
  name: 'The Lab',
  blurb: "Robby's home. Mind the clutter.",
  theme: 'lab',
  levels: [
    {
      id: 'lab-1', theme: 'lab', room: 'Charging Nook',
      // one direction, four tiles: one instruction buys the whole run
      map: ['#########', '#R....*##', '#########'],
      goal: { type: 'collect' }, tray: { right: 1 },
      par: ['right'],
    },
    {
      id: 'lab-2', theme: 'lab', room: 'Hallway',
      // the first corner. The robot must be told to turn.
      map: ['#######', '#R....#', '#####.#', '#####*#', '#######'],
      goal: { type: 'collect' }, tray: { right: 1, down: 1 },
      par: ['right', 'down'],
    },
    {
      id: 'lab-3', theme: 'lab', room: 'Workshop',
      // two corners, back to back
      map: ['#########', '#R...####', '####.####', '####..*##', '#########'],
      goal: { type: 'collect' }, tray: { right: 2, down: 1 },
      par: ['right', 'down', 'right'],
    },
    {
      id: 'lab-4', theme: 'lab', room: 'Pantry',
      // the first real choice; the wrong turn is a short, fully visible stub
      map: ['#########', '#R....*##', '####.####', '####.####', '#########'],
      goal: { type: 'collect' }, tray: { right: 2, down: 1 },
      par: ['right', 'right'],
    },
    {
      id: 'lab-5', theme: 'lab', room: 'Sleep Bay',
      // same split, but this time the battery is down the branch
      map: ['#########', '#R.....##', '####.####', '####*####', '#########'],
      goal: { type: 'collect' }, tray: { right: 2, down: 1 },
      par: ['right', 'down'],
    },
    {
      id: 'lab-6', theme: 'lab', room: 'Garage',
      // a split, then corners all the way round
      map: ['########', '#R...#*#', '###.##.#', '###....#', '########'],
      goal: { type: 'collect' }, tray: { right: 2, down: 1, up: 1 },
      par: ['right', 'down', 'right', 'up'],
    },
    {
      id: 'lab-7', theme: 'lab', room: 'Attic',
      // corners and a split where the wrong branch is a long climb
      map: ['#########', '#R..#...#', '###.#.###', '###.#.###', '###...###',
            '#####.###', '#####..*#', '#########'],
      goal: { type: 'collect' }, tray: { right: 3, down: 2, up: 1 },
      par: ['right', 'down', 'right', 'down', 'right'],
    },
    {
      id: 'lab-8', theme: 'lab', room: 'Launch Bay',
      // the finale: fetch the battery, double back, and board the rocket
      map: ['#########', '#R....#@#', '#####.#.#', '#####...#', '#####*###', '#########'],
      goal: { type: 'exit', requires: ['battery'] },
      tray: { right: 2, down: 2, up: 2, left: 1 },
      par: ['right', 'down', 'down', 'up', 'right', 'up'],
    },
  ],
}

/**
 * World 2 — The Mechanical Forest. Silver trunks, green light, purple sap.
 * Rooms open out: there is usually more than one way through, some ways are
 * shut for good, and from the fourth clearing on there is more than one thing
 * to fetch. Parts can be collected in any order — the room ends the moment the
 * last one leaves the ground.
 */
const forest: Chapter = {
  id: 'forest',
  name: 'Mechanical Forest',
  blurb: 'Two ways round, and one of them is shut.',
  theme: 'forest',
  levels: [
    {
      id: '2-1', theme: 'forest', room: 'Two Ways',
      // both ways round are the same length and use the same three tokens;
      // the only question is which order
      map: ['#######', '#..R..#', '#.###.#', '#.###.#', '#..*..#', '#######'],
      goal: { type: 'collect' }, tray: { right: 1, down: 1, left: 1 },
      par: ['right', 'down', 'left'],
    },
    {
      id: '2-2', theme: 'forest', room: 'Bramble',
      // the same room, but one way round is grown over for good
      map: ['#######', '#..R..#', '#.###.#', '#=###.#', '#..*..#', '#######'],
      goal: { type: 'collect' }, tray: { right: 1, down: 1, left: 1 },
      par: ['right', 'down', 'left'],
    },
    {
      id: '2-3', theme: 'forest', room: 'Deadfall',
      map: ['########', '#R.....#', '#.####.#', '#.#==#.#', '#.#..#.#', '#....#.#', '####*#.#', '########'],
      goal: { type: 'collect' }, tray: { down: 2, right: 2, left: 1, up: 1 },
      par: ['down', 'right', 'right', 'down'],
    },
    {
      id: '2-4', theme: 'forest', room: 'Two Cogs',
      // the first room with more than one thing to fetch
      map: ['#######', '#c...s#', '###.###', '###R###', '#######'],
      goal: { type: 'collect' }, tray: { up: 1, right: 1, left: 2, down: 1 },
      par: ['up', 'right', 'left', 'left'],
    },
    {
      id: '2-5', theme: 'forest', room: 'Crossroads',
      // three arms, three parts, any order you like
      map: ['#######', '###c###', '###.###', '#s.R.x#', '#######'],
      goal: { type: 'collect' }, tray: { up: 1, down: 2, right: 2, left: 2 },
      par: ['up', 'down', 'right', 'left', 'left'],
    },
    {
      id: '2-6', theme: 'forest', room: 'Fallen Trunk',
      // four arms now, and the fourth is blocked
      map: ['#########', '####c####', '####.####', '#s..R..x#', '####.####', '####=####', '#########'],
      goal: { type: 'collect' }, tray: { up: 1, down: 2, right: 2, left: 2 },
      par: ['up', 'down', 'right', 'left', 'left'],
    },
    {
      id: '2-7', theme: 'forest', room: 'Deep Wood',
      map: ['########', '#R.....#', '#.####.#', '#.#c=#.#', '#.#..#.#', '#.##.#.#', '#s..x#.#', '########'],
      goal: { type: 'collect' }, tray: { down: 2, right: 2, up: 2, left: 2 },
      par: ['down', 'right', 'up', 'left', 'up'],
    },
    {
      id: '2-8', theme: 'forest', room: 'Clearing',
      // The finale: three parts, then the rocket — which will not move without
      // all of them, and says so. The tray is deliberately loose, so a child who
      // finds a longer way round is not stopped by running out of arrows.
      map: ['#########', '#R..c..s#', '#.#.#.#.#', '#x..#..@#', '#########'],
      goal: { type: 'exit', requires: ['cog', 'coil', 'core'] },
      tray: { right: 4, down: 3, left: 3, up: 2 },
      par: ['down', 'up', 'right', 'right', 'right', 'down'],
    },
  ],
}

/**
 * World 3 — The Scrapyard. Everything here moves you about whether you asked or
 * not. The theme is scarcity of instructions: several rooms hand you a tray with
 * a direction missing, and the conveyors are how you go that way instead.
 *
 * Not one par in this world spends a `left`.
 */
const scrapyard: Chapter = {
  id: 'scrap',
  name: 'The Scrapyard',
  blurb: 'Let the machines do the walking.',
  theme: 'scrap',
  levels: [
    {
      id: '3-1', theme: 'scrap', room: 'Grand Tour',
      // One instruction, and the yard hands him round all four directions. The
      // battery is one step to his left, and there is no left in the tray.
      map: ['#########', '#*REEEES#', '#N#####S#', '#NWWWWWW#', '#########'],
      goal: { type: 'collect' }, tray: { right: 1, down: 1, up: 1 },
      par: ['right'],
    },
    {
      id: '3-2', theme: 'scrap', room: 'The Lift',
      // No up in the tray either: the belt is the only way to climb.
      map: ['#########', '#...N..*#', '####N####', '#R..N####', '#########'],
      goal: { type: 'collect' }, tray: { right: 2, down: 1 },
      par: ['right', 'right'],
    },
    {
      id: '3-3', theme: 'scrap', room: 'The Chute',
      map: ['#######', '#R....#', '####.##', '####S##', '####S##', '####.*#', '#######'],
      goal: { type: 'collect' }, tray: { right: 2, down: 2, left: 1 },
      par: ['right', 'down', 'right'],
    },
    {
      id: '3-4', theme: 'scrap', room: 'No Left Turns',
      // A long belt west, boarded from above because you cannot walk onto one
      // head-on against its flow.
      map: ['#########', '#R......#', '#######.#', '#WWWWWWW#', '#*#######', '#########'],
      goal: { type: 'collect' }, tray: { right: 1, down: 2, up: 1 },
      par: ['right', 'down', 'down'],
    },
    {
      id: '3-5', theme: 'scrap', room: 'Crossfeed',
      map: ['#########', '#R..#..*#', '#.#.#.#.#', '#.#EEE#.#', '#.#####N#', '#.......#', '#########'],
      goal: { type: 'collect' }, tray: { down: 2, right: 2, up: 2, left: 1 },
      par: ['down', 'right', 'up'],
    },
    {
      id: '3-6', theme: 'scrap', room: 'The Sorter',
      // three chutes, two of them shut for good
      map: ['#########', '#R......#', '###S#S#S#', '###.#.#.#', '###=#=#*#', '#########'],
      goal: { type: 'collect' }, tray: { right: 3, down: 2, left: 1 },
      par: ['right', 'right', 'right', 'down'],
    },
    {
      id: '3-7', theme: 'scrap', room: 'The Collector',
      // The pattern the last room is built on: fetch a part, and the yard posts
      // you back to where you started.
      map: ['#########', '#RWWWWWW#', '#.#####N#', '#..c...N#', '#.#####N#', '#..s...N#', '#########'],
      goal: { type: 'collect' }, tray: { down: 3, right: 2, up: 1 },
      par: ['down', 'right', 'down', 'down', 'right'],
    },
    {
      id: '3-8', theme: 'scrap', room: 'The Line',
      /*
       * The finale, and there is no `left` in the tray at all.
       *
       * Three side rooms, each holding a part. Each ends at the north belt,
       * which posts him up to the collector, which runs him west and sets him
       * down exactly where he began. Three times round, and then the bottom
       * belt carries him the length of the yard to the rocket.
       *
       * Arriving early is allowed and costs him: the rocket will not go without
       * all three, and the only way off the pad is the north belt, which takes
       * him all the way round again.
       */
      map: [
        '#########',
        '#RWWWWWW#',
        '#.#####N#',
        '#..c...N#',
        '#.#####N#',
        '#..s...N#',
        '#.#####N#',
        '#..x...N#',
        '#.#####N#',
        '#EEEEEE@#',
        '#########',
      ],
      goal: { type: 'exit', requires: ['cog', 'coil', 'core'] },
      tray: { down: 12, right: 5, up: 2 },
      par: [
        'down', 'right',                    // the cog, and the yard posts him home
        'down', 'down', 'right',            // the coil, and home again
        'down', 'down', 'down', 'right',    // the core, and home once more
        'down', 'down', 'down', 'down',     // then the length of the spine to the delivery belt
      ],
    },
  ],
}

/**
 * World 4 — The Cheese Moon. Everything here is about bridges, and a bridge
 * only works once: crossing one pulls it apart behind you. So the puzzle stops
 * being "which way" and becomes "in which order", which is the same question a
 * child asks about their shoes and their wellies.
 */
const cheeseMoon: Chapter = {
  id: 'moon',
  name: 'The Cheese Moon',
  blurb: 'Mind the bridges. They only hold once.',
  theme: 'cheese',
  levels: [
    {
      id: '4-1', theme: 'cheese', room: 'First Span',
      map: ['#######', '#R~~~*#', '#######'],
      goal: { type: 'collect' }, tray: { right: 1 },
      par: ['right'],
    },
    {
      id: '4-2', theme: 'cheese', room: 'Mind the Gap',
      // the bridge is the obvious way and it goes nowhere; the span falls in
      // behind and leaves him stuck, which is a lesson best learnt on level two
      map: ['#######', '#R~~.##', '#.#####', '#...*.#', '#######'],
      goal: { type: 'collect' }, tray: { down: 1, right: 2 },
      par: ['down', 'right'],
    },
    {
      id: '4-3', theme: 'cheese', room: 'Pick One',
      // two spans to the same shore: either will do, but only one of them
      map: ['#######', '#..*..#', '#~###~#', '#..R..#', '#######'],
      goal: { type: 'collect' }, tray: { right: 1, up: 1, left: 1, down: 1 },
      par: ['right', 'up', 'left'],
    },
    {
      id: '4-4', theme: 'cheese', room: 'The Long Way',
      map: ['#########', '#R~~~~~.#', '#######.#', '#...*...#', '#########'],
      goal: { type: 'collect' }, tray: { right: 1, down: 1, left: 1 },
      par: ['right', 'down', 'left'],
    },
    {
      id: '4-5', theme: 'cheese', room: 'Fetch Order',
      // the first room where the order is the whole puzzle: cross the span and
      // the far shore is gone for good, so the near errand has to come first
      map: ['#########', '#R.....s#', '#~#######', '#c......#', '#########'],
      goal: { type: 'collect' }, tray: { right: 1, left: 1, down: 1 },
      par: ['right', 'left', 'down'],
    },
    {
      id: '4-6', theme: 'cheese', room: 'Both Shores',
      map: ['#########', '#..~R~..#', '#c#####s#', '#.......#', '#########'],
      goal: { type: 'collect' }, tray: { right: 1, down: 1, left: 1, up: 1 },
      par: ['right', 'down', 'left', 'up'],
    },
    {
      id: '4-7', theme: 'cheese', room: 'Three Shores',
      map: ['#########', '#..~R~..#', '#c#####s#', '#...x...#', '#########'],
      goal: { type: 'collect' }, tray: { right: 1, down: 1, left: 1, up: 1 },
      par: ['right', 'down', 'left', 'up'],
    },
    {
      id: '4-8', theme: 'cheese', room: 'Order of Things',
      /*
       * The finale. Two spans, three parts, and only one order that works.
       *
       * The coil is up the solid corridor and can be fetched and returned from.
       * The first span drops him to the middle shore for the cog, and shuts.
       * The second drops him beside the rocket — where he lands short, because
       * the core is at the far end of the bottom shore, and the only way to it
       * is to walk the length of the moon and come back.
       *
       * Take the spans first and he is stranded with two parts and no way up.
       */
      map: [
        '#########',
        '#R.....s#',
        '#~#######',
        '#c......#',
        '#######~#',
        '#x.....@#',
        '#########',
      ],
      goal: { type: 'exit', requires: ['cog', 'coil', 'core'] },
      tray: { right: 4, left: 3, down: 3, up: 1 },
      par: ['right', 'left', 'down', 'right', 'down', 'left', 'right'],
    },
  ],
}

/**
 * The scratch chapter where each mechanic gets its own room. Not a curve —
 * a bench. Every trigger the engine supports has a level here.
 */
const testWorld: Chapter = {
  id: 'test',
  name: 'Test World',
  blurb: 'One room per mechanic.',
  theme: 'garden',
  levels: [
    {
      id: 't-1', theme: 'house', room: 'Straight',
      map: ['#######', '#R...*#', '#######'],
      goal: { type: 'collect' }, tray: { right: 1 }, par: ['right'],
    },
    {
      id: 't-2', theme: 'house', room: 'Corner',
      map: ['#####', '#R..#', '###.#', '###.#', '###*#', '#####'],
      goal: { type: 'collect' }, tray: { right: 1, down: 1 }, par: ['right', 'down'],
    },
    {
      id: 't-3', theme: 'garden', room: 'Split',
      map: ['#######', '#R...*#', '###.###', '###.###', '#######'],
      goal: { type: 'collect' }, tray: { right: 2, down: 1 }, par: ['right', 'right'],
    },
    {
      id: 't-4', theme: 'garden', room: 'Branch',
      map: ['#######', '#R....#', '###.###', '###*###', '#######'],
      goal: { type: 'collect' }, tray: { right: 2, down: 1 }, par: ['right', 'down'],
    },
    {
      id: 't-5', theme: 'city', room: 'Zigzag',
      map: ['#######', '#R..#*#', '###.#.#', '###...#', '#######'],
      goal: { type: 'collect' }, tray: { right: 2, down: 1, up: 1 },
      par: ['right', 'down', 'right', 'up'],
    },
    {
      id: 't-6', theme: 'factory', room: 'Plate & Gate',
      // the plate is a dead end, so the robot has to reverse out of it
      map: ['#######', '#R.A###', '##.####', '##1####', '##*####', '#######'],
      goal: { type: 'collect' }, tray: { right: 2, left: 1, down: 1 },
      par: ['right', 'right', 'left', 'down'],
    },
    {
      id: 't-7', theme: 'scrap', room: 'Conveyor',
      // The belt is the only way across. One instruction gets him on it and the
      // ride is free; the way back is refused, because you cannot walk onto a
      // conveyor against its flow.
      map: [
        '#########',
        '#R.....##',
        '#.#####.#',
        '#.EEEEE.#',
        '#######.#',
        '##..*...#',
        '#########',
      ],
      goal: { type: 'collect' },
      tray: { down: 2, right: 2, left: 2, up: 1 },
      par: ['down', 'right', 'down', 'left'],
    },
    {
      id: 't-8', theme: 'cheese', room: 'Cheese Moon',
      /*
       * Cheese-string bridges. Crossing one pulls it apart behind you, so the
       * top of the map severs itself as you go and the way back is always the
       * long way round. Both parts are reachable either way about, and the two
       * solutions use the same four arrows in a different order.
       */
      map: ['#########', '#c~~R~~s#', '#.#####.#', '#.......#', '#########'],
      goal: { type: 'collect' },
      tray: { right: 1, down: 1, left: 1, up: 1 },
      par: ['right', 'down', 'left', 'up'],
    },
    {
      id: 't-9', theme: 'ship', room: 'Rocket',
      // the bridge falls in behind you, so the way to the pad can't be the way
      // you came. The rocket only launches once the battery is aboard.
      map: ['########', '#R~~~~*#', '#.####.#', '#@.....#', '########'],
      goal: { type: 'exit', requires: ['battery'] },
      tray: { right: 1, left: 1, up: 1, down: 1 },
      par: ['right', 'down', 'left'],
    },
  ],
}

export const chapters: Chapter[] = [lab, forest, scrapyard, cheeseMoon, testWorld]
export const allLevels: Level[] = chapters.flatMap((c) => c.levels)

/** @deprecated kept for the engine tests that predate chapters */
export const world1 = lab.levels
