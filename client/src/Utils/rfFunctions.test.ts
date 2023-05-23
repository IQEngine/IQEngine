import {
  calculateDate,
  calculateSampleCount,
  getOriginalFrequency,
  getFrequency,
  getSeconds,
} from '@/Utils/rfFunctions';
import { Temporal } from '@js-temporal/polyfill';

describe('Calculate date', () => {
  test('should calculate date correctly', () => {
    // Arrange
    const startDate = Temporal.Instant.from('2021-01-01T00:00:00.000000Z');
    const count = 1;
    const sampleRate = 1;

    // Act
    const result = calculateDate(startDate, count, sampleRate);

    // Assert
    expect(result).toBe('2021-01-01T00:00:01Z');
  });
});

describe('Calculate sample count', () => {
  test('should calculate date correctly', () => {
    // Arrange
    const startDate = Temporal.Instant.from('2021-01-01T00:00:00Z');
    const currentDate = Temporal.Instant.from('2021-01-01T00:00:01Z');
    const sampleRate = 1;

    // Act
    const result = calculateSampleCount(startDate, currentDate, sampleRate);

    // Assert
    expect(result).toBe(1);
  });
});

describe('Get frequency', () => {
  // Arrange
  test.each`
    freq             | expected
    ${1e11}          | ${{ freq: 1e2, unit: 'GHz' }}
    ${1e9}           | ${{ freq: 1, unit: 'GHz' }}
    ${1e8}           | ${{ freq: 1e2, unit: 'MHz' }}
    ${1e6}           | ${{ freq: 1, unit: 'MHz' }}
    ${1e5}           | ${{ freq: 1e2, unit: 'kHz' }}
    ${1e3}           | ${{ freq: 1, unit: 'kHz' }}
    ${1e2}           | ${{ freq: 1e2, unit: 'Hz' }}
    ${1}             | ${{ freq: 1, unit: 'Hz' }}
    ${1.00000000001} | ${{ freq: 1, unit: 'Hz' }}
  `('should get frequency correctly', ({ freq, expected }) => {
    // Act
    const result = getFrequency(freq);

    // Assert
    expect(result).toEqual(expected);
  });
});

describe('Get original frequency', () => {
  // Arrange
  test.each`
    freq             | unit     | expected
    ${1e3}           | ${'Hz'}  | ${'1000'}
    ${1e2}           | ${'Hz'}  | ${'100'}
    ${1e1}           | ${'Hz'}  | ${'10'}
    ${1}             | ${'Hz'}  | ${'1'}
    ${1.00000000001} | ${'Hz'}  | ${'1'}
    ${1e3}           | ${'kHz'} | ${'1000000'}
    ${1e2}           | ${'kHz'} | ${'100000'}
    ${1e1}           | ${'kHz'} | ${'10000'}
    ${1}             | ${'kHz'} | ${'1000'}
    ${1.00000000001} | ${'kHz'} | ${'1000'}
    ${1e3}           | ${'MHz'} | ${'1000000000'}
    ${1e2}           | ${'MHz'} | ${'100000000'}
    ${1e1}           | ${'MHz'} | ${'10000000'}
    ${1}             | ${'MHz'} | ${'1000000'}
    ${1.00000000001} | ${'MHz'} | ${'1000000'}
    ${1e3}           | ${'GHz'} | ${'1000000000000'}
    ${1e2}           | ${'GHz'} | ${'100000000000'}
    ${1e1}           | ${'GHz'} | ${'10000000000'}
    ${1}             | ${'GHz'} | ${'1000000000'}
    ${1.00000000001} | ${'GHz'} | ${'1000000000'}
  `('should get original frequency correctly', ({ freq, unit, expected }) => {
    // Act
    const result = getOriginalFrequency(freq, unit);

    // Assert
    expect(result).toEqual(expected);
  });
});

describe('Get seconds', () => {
  // Arrange
  test.each`
    time              | expected
    ${1}              | ${{ unit: 'ms', time: 1000 }}
    ${0.1}            | ${{ unit: 'ms', time: 100 }}
    ${0.01}           | ${{ unit: 'ms', time: 10 }}
    ${0.001}          | ${{ unit: 'ms', time: 1 }}
    ${0.0001}         | ${{ unit: 'us', time: 100 }}
    ${0.00001}        | ${{ unit: 'us', time: 10 }}
    ${0.000001}       | ${{ unit: 'us', time: 1 }}
    ${0.0000001}      | ${{ unit: 'ns', time: 100 }}
    ${0.00000001}     | ${{ unit: 'ns', time: 10 }}
    ${0.000000001}    | ${{ unit: 'ns', time: 1 }}
    ${0.0000000001}   | ${{ unit: 'ps', time: 100 }}
    ${0.00000000001}  | ${{ unit: 'ps', time: 10 }}
    ${0.000000000001} | ${{ unit: 'ps', time: 1 }}
  `('should get seconds correctly', ({ time, unit, expected }) => {
    // Act
    const result = getSeconds(time);

    // Assert
    expect(result).toEqual(expected);
  });
});
