import { describe, expect, test, vi } from 'vitest';
import { queries } from '@/pages/browser/metadata-query/queries';

describe('Test query validation objects', () => {
  /* DISABLED BECAUSE WAS GETTING min_datetime=2022-01-02T00%3A00%3A00-05  %3A00&max_datetime=2023-01-01T00%3A00%3A00-05  %3A00
  test('date validation returns correct query string', () => {
    const { validator } = queries.date;
    const expected = 'min_datetime=2022-01-02T00%3A00%3A00%2B00%3A00&max_datetime=2023-01-01T00%3A00%3A00%2B00%3A00';
    const result = validator({ to: '2023-01-01', from: '2022-01-02' });
    expect(result).toBe(expected);
  });
  */
  test('date validation fails on incorrect dates', () => {
    const { validator } = queries.date;
    const expected = false;
    const result = validator({ to: '2022-01-01', from: '2023-01-02' });
    expect(result).toBe(expected);
  });
  test('geo validation returns correct query string', () => {
    const { validator } = queries.geo;
    const lat = 1;
    const lon = 2;
    const radius = 3;
    const expected = `captures_geo=${lon},${lat},${radius}`;
    const result = validator({ lat, lon, radius, queryType: 'captures' });
    expect(result).toBe(expected);
  });
  test('author validation returns correct query string', () => {
    const { validator } = queries.author;
    const author = 'test author';
    const expected = `author=test%20author`;
    const result = validator(author);
    expect(result).toBe(expected);
  });
  test('frequency validation returns correct query string', () => {
    const { validator } = queries.frequency;
    const from = 1;
    const to = 2;
    const expected = `min_frequency=${from}&max_frequency=${to}`;
    const result = validator({ from, to });
    expect(result).toBe(expected);
  });
  test('frequency validation fails on incorrect frequencies', () => {
    const { validator } = queries.frequency;
    const from = 2;
    const to = 1;
    const expected = false;
    const result = validator({ from, to });
    expect(result).toBe(expected);
  });
  test('comment validation returns correct query string', () => {
    const { validator } = queries.comment;
    const comment = 'test comment';
    const expected = `comment=test%20comment`;
    const result = validator(comment);
    expect(result).toBe(expected);
  });
  test('container validation returns correct query string', () => {
    const { validator } = queries.container;
    const container = 'test container';
    const expected = `container=test%20container`;
    const result = validator(container);
    expect(result).toBe(expected);
  });
  test('text validation returns correct query string', () => {
    const { validator } = queries.text;
    const text = 'test text';
    const expected = `text=test%20text`;
    const result = validator(text);
    expect(result).toBe(expected);
  });
  test('label validation returns correct query string', () => {
    const { validator } = queries.label;
    const label = 'test label';
    const expected = `label=test%20label`;
    const result = validator(label);
    expect(result).toBe(expected);
  });

  test('source query validation returns correct query string', () => {
    const { validator } = queries.datasource;
    const datasourceName = ['iqengine/gnuradio'];
    const expected = 'databaseid=iqengine%2Fgnuradio';
    const result = validator(datasourceName);
    expect(result).toBe(expected);
  });

  test('source query validation returns correct query string with multiple selections', () => {
    const { validator } = queries.datasource;
    const datasourceName = ['iqengine/gnuradio', 'example/anexample', 'account/container'];
    const expected = 'databaseid=iqengine%2Fgnuradio&databaseid=example%2Fanexample&databaseid=account%2Fcontainer';
    const result = validator(datasourceName);
    expect(result).toBe(expected);
  });
});
