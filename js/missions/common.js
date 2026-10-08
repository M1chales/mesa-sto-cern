// Shared mission helpers.
import { h } from '../ui.js';

// Accordion block
export function acc(icon, title, body, open = false) {
  return h(`<details class="acc" ${open ? 'open' : ''}><summary><span class="ico">${icon}</span>${title}</summary><div>${body}</div></details>`);
}

export function section(title, html = '') {
  return h(`<div class="block"><h3>${title}</h3>${html}</div>`);
}
