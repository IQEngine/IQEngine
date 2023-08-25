import { groupContiguousIndexes } from '@/utils/group';

describe('test function to group by contigous indexes', () => {
  test.each`
    input                            | output
    ${[1, 2, 3, 4, 5]}               | ${[{ start: 1, count: 5 }]}
    ${[1, 2, 3, 5, 6]}               | ${[{ start: 1, count: 3 }, { start: 5, count: 2 }]}
    ${[1, 2, 3, 5, 7]}               | ${[{ start: 1, count: 3 }, { start: 5, count: 1 }, { start: 7, count: 1 }]}
    ${[1, 2, 3, 5, 6, 7, 9, 10, 11]} | ${[{ start: 1, count: 3 }, { start: 5, count: 3 }, { start: 9, count: 3 }]}
    ${[]}                            | ${[]}
  `('should correct group values ordered', ({ input, output }) => {
    expect(groupContiguousIndexes(input)).toEqual(output);
  });

  test.each`
    input                            | output
    ${[5, 4, 3, 2, 1]}               | ${[{ start: 1, count: 5 }]}
    ${[6, 5, 3, 2, 1]}               | ${[{ start: 1, count: 3 }, { start: 5, count: 2 }]}
    ${[7, 5, 3, 2, 1]}               | ${[{ start: 1, count: 3 }, { start: 5, count: 1 }, { start: 7, count: 1 }]}
    ${[11, 10, 9, 7, 6, 5, 3, 2, 1]} | ${[{ start: 1, count: 3 }, { start: 5, count: 3 }, { start: 9, count: 3 }]}
    ${[11, 8, 5, 19, 14, 12, 13]}    | ${[{ start: 5, count: 1 }, { start: 8, count: 1 }, { start: 11, count: 4 }, { start: 19, count: 1 }]}
  `('should correct group values unordered', ({ input, output }) => {
    expect(groupContiguousIndexes(input)).toEqual(output);
  });
});
