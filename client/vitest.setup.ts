import 'vitest-canvas-mock';
import axios from 'axios';

// needed to go from axios v 1.4 to 1.5
beforeAll(() => {
  axios.defaults.adapter = 'xhr';
});
