import { mount } from 'svelte'
import App from './App.svelte'
// Latin subsets only, embedded in the bundle. The game has to run from a file
// with no network, so the font travels with it rather than being fetched.
import './fonts.css'
import './styles/index.css'

mount(App, { target: document.getElementById('app')! })
