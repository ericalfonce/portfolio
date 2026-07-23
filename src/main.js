import './terminal.js';
import { initGrain } from './grain.js';
import { initCursor } from './cursor.js';
import { buildSite } from './site.js';
import { initScroll } from './scroll.js';

initGrain();
initCursor();
buildSite();
initScroll();
