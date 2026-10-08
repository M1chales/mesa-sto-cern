import hq from './m01-hq.js';
import zoom from './m02-zoom.js';
import dex from './m03-dex.js';
import blind from './m04-blind.js';
import lhc from './m05-lhc.js';
import detector from './m06-detector.js';
import higgs from './m07-higgs.js';
import muon from './m08-muon.js';
import side from './m09-side.js';
import code from './m10-code.js';

export const MISSIONS = [hq, zoom, dex, blind, lhc, detector, higgs, muon, side, code];
// chapter numbers follow the order above
MISSIONS.forEach((m, i) => { m.num = i + 1; });
