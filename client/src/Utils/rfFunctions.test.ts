import {
  calculateDate,
  calculateSampleCount,
  getOriginalFrequency,
  getFrequency,
  getSeconds,
  validateDate,
  validateFrequency,
} from '@/Utils/rfFunctions';

describe('Calculate date', () => {
  // Arrange
  test.each`
    startDate                     | count | sampleRate | expected
    ${'2021-01-01T00:00:00.000Z'} | ${1}  | ${1}       | ${'2021-01-01T00:00:01Z'}
    ${'invalid date'}             | ${1}  | ${1}       | ${null}
  `('should calculate date correctly', ({ startDate, count, sampleRate, expected }) => {
    // Act
    const result = calculateDate(startDate, count, sampleRate);

    // Assert
    expect(result).toBe(expected);
  });
});

describe('Calculate sample count', () => {
  // Arrange
  test.each`
    startDate                     | currentDate                   | sampleRate | expected
    ${'2021-01-01T00:00:00.000Z'} | ${'2021-01-01T00:00:01.000Z'} | ${1}       | ${1}
    ${'invalid date'}             | ${'2021-01-01T00:00:01.000Z'} | ${2}       | ${null}
    ${'2021-01-01T00:00:00.000Z'} | ${'invalid date'}             | ${2}       | ${null}
  `('should calculate date correctly', ({ startDate, currentDate, sampleRate, expected }) => {
    // Act
    const result = calculateSampleCount(startDate, currentDate, sampleRate);

    // Assert
    expect(result).toBe(expected);
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
    ${1e3}           | ${'Hz'}  | ${1000}
    ${1e2}           | ${'Hz'}  | ${100}
    ${1e1}           | ${'Hz'}  | ${10}
    ${1}             | ${'Hz'}  | ${1}
    ${1.00000000001} | ${'Hz'}  | ${1}
    ${1e3}           | ${'kHz'} | ${1000000}
    ${1e2}           | ${'kHz'} | ${100000}
    ${1e1}           | ${'kHz'} | ${10000}
    ${1}             | ${'kHz'} | ${1000}
    ${1.00000000001} | ${'kHz'} | ${1000}
    ${1e3}           | ${'MHz'} | ${1000000000}
    ${1e2}           | ${'MHz'} | ${100000000}
    ${1e1}           | ${'MHz'} | ${10000000}
    ${1}             | ${'MHz'} | ${1000000}
    ${1.00000000001} | ${'MHz'} | ${1000000}
    ${1e3}           | ${'GHz'} | ${1000000000000}
    ${1e2}           | ${'GHz'} | ${100000000000}
    ${1e1}           | ${'GHz'} | ${10000000000}
    ${1}             | ${'GHz'} | ${1000000000}
    ${1.00000000001} | ${'GHz'} | ${1000000000}
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

describe('Validate frequency', () => {
  // Arrange
  test.each`
    inputFreq | minFreq | maxFreq | expected
    ${1e11}   | ${1e10} | ${1e12} | ${null}
    ${1e11}   | ${1e12} | ${1e12} | ${'Frequency must be greater than the minimum frequency of the file'}
    ${1e11}   | ${1e10} | ${1e10} | ${'Frequency must be less than the maximum frequency of the file'}
    ${'test'} | ${1e10} | ${1e12} | ${'Invalid frequency'}
  `('should validate frequency correctly', ({ inputFreq, minFreq, maxFreq, expected }) => {
    // Act
    const result = validateFrequency(inputFreq, minFreq, maxFreq);

    // Assert
    expect(result).toEqual(expected);
  });
});

describe('Validate date', () => {
  // Arrange
  test.each`
    inputDate                 | minDate                   | maxDate                   | expected
    ${'2021-01-01T00:00:00Z'} | ${'2021-01-01T00:00:00Z'} | ${'2021-01-01T00:00:00Z'} | ${null}
    ${'2021-01-01T00:00:00Z'} | ${'2021-01-02T00:00:00Z'} | ${'2021-01-02T00:00:00Z'} | ${'Start date must be after start of the file'}
    ${'2021-01-01T00:00:01Z'} | ${'2021-01-01T00:00:00Z'} | ${'2021-01-01T00:00:00Z'} | ${'End date must be before end of the file'}
    ${'test'}                 | ${'2021-01-01T00:00:00Z'} | ${'2021-01-01T00:00:00Z'} | ${'Invalid date'}
    ${'2021-01-01T00:00:01Z'} | ${'test'}                 | ${'2021-01-01T00:00:00Z'} | ${'Invalid date'}
    ${'2021-01-01T00:00:01Z'} | ${'2021-01-01T00:00:00Z'} | ${'test'}                 | ${'Invalid date'}
  `('should validate date correctly', ({ inputDate, minDate, maxDate, expected }) => {
    // Act
    const result = validateDate(inputDate, maxDate, minDate);

    // Assert
    expect(result).toEqual(expected);
  });
});
