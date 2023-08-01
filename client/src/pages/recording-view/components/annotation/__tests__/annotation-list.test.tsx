import { describe, expect, test } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import { AnnotationList } from '../annotation-list';
import React from 'react';
import metadataJson from './annotation-list.test.meta.json';
import { SigMFMetadata } from '@/utils/sigmfMetadata';
import nock from 'nock';
import { AllProviders, queryClient } from '@/mocks/setup-tests';
import { SpectrogramContextProvider } from '@/pages/recording-view/hooks/use-spectrogram-context';

import { act } from 'react-dom/test-utils';

describe('Annotation list component', () => {
  beforeEach(() => {
    queryClient.clear();
    nock.cleanAll();
    nock('http://localhost:3000')
      .get('/api/config')
      .reply(200, {
        uploadPageBlobSasUrl: 'NOT A VALID SAS URL',

        internalBranding: false,
        featureFlags: {
          useAPIDatasources: true,
          useNewSpectrogramPage: true,
        },
      });
  });

  test('Columns display correctly', async () => {
    //Arrange
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));
    nock('http://localhost:3000')
      .get('/api/datasources/testaccount/testcontainer/test_file_path/meta')
      .reply(200, meta);
    // Act
    render(<AnnotationList setCurrentFFT={() => {}} currentFFT={0}></AnnotationList>, {
      wrapper: ({ children }) => (
        <AllProviders>
          <SpectrogramContextProvider
            account={'testaccount'}
            container={'testcontainer'}
            filePath={'test_file_path'}
            type={'api'}
          >
            {children}
          </SpectrogramContextProvider>
        </AllProviders>
      ),
    });

    // Assert column are in document
    waitFor(() => {
      expect(screen.queryByText('Time Range')).toBeInTheDocument();
      expect(screen.queryByText('Annotation')).toBeInTheDocument();
      expect(screen.queryByText('Frequency Range')).toBeInTheDocument();
      expect(screen.queryByText('BW')).toBeInTheDocument();
      expect(screen.queryByText('Label')).toBeInTheDocument();
      expect(screen.queryByText('Duration')).toBeInTheDocument();
      expect(screen.queryByText('Actions')).toBeInTheDocument();
    });
  });

  test('Columns display correctly when no capture date time', async () => {
    //Arrange
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));
    delete meta.captures[0]['core:datetime'];

    nock('http://localhost:3000')
      .get('/api/datasources/testaccount/testcontainer/test_file_path/meta')
      .reply(200, meta);
    // Act
    render(<AnnotationList setCurrentFFT={() => {}} currentFFT={0}></AnnotationList>, {
      wrapper: ({ children }) => (
        <AllProviders>
          <SpectrogramContextProvider
            account={'testaccount'}
            container={'testcontainer'}
            filePath={'test_file_path'}
            type={'api'}
          >
            {children}
          </SpectrogramContextProvider>
        </AllProviders>
      ),
    });

    waitFor(
      () => {
        // Assert values are in document
        expect(screen.findByText('883.275')).toBeInTheDocument();
        expect(screen.findByText('884.625')).toBeInTheDocument();
        expect(screen.findByText('1.35MHz')).toBeInTheDocument();
        expect(screen.findByText('LTE')).toBeInTheDocument();
        expect(screen.findByText('5ms')).toBeInTheDocument();
        expect(screen.findByText('Sample comment')).toBeInTheDocument();
      },
      { timeout: 1000000 }
    );

    waitFor(
      () => {
        // Assert columns are not in document
        expect(screen.queryByText('Time Range')).not.toBeInTheDocument();

        // Assert columns are in document
        expect(screen.queryByText('Annotation')).toBeInTheDocument();
        expect(screen.queryByText('Frequency Range')).toBeInTheDocument();
        expect(screen.queryByText('BW')).toBeInTheDocument();
        expect(screen.queryByText('Label')).toBeInTheDocument();
        expect(screen.queryByText('Duration')).toBeInTheDocument();
        expect(screen.queryByText('Actions')).toBeInTheDocument();
      },
      { timeout: 1000000 }
    );
  });

  test.each`
    input                         | column
    ${'invalid date'}             | ${'Time Range'}
    ${'2022-03-17T16:43:30.0025'} | ${'Time Range'}
  `('Hide column and value when invalid', async ({ input }) => {
    // Arrange
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));
    meta.captures[0]['core:datetime'] = input;
    nock('http://localhost:3000')
      .get('/api/datasources/testaccount/testcontainer/test_file_path/meta')
      .reply(200, meta);

    // Act
    render(
      <AllProviders>
        <SpectrogramContextProvider
          account={'testaccount'}
          container={'testcontainer'}
          filePath={'test_file_path'}
          type={'api'}
        >
          <AnnotationList setCurrentFFT={() => {}} currentFFT={0}></AnnotationList>
        </SpectrogramContextProvider>
      </AllProviders>
    );

    waitFor(() => {
      // Assert values are in document
      expect(screen.queryByText('883.275')).toBeInTheDocument();
      expect(screen.queryByText('884.625')).toBeInTheDocument();
      expect(screen.queryByText('1.35MHz')).toBeInTheDocument();
      expect(screen.queryByText('LTE')).toBeInTheDocument();
      expect(screen.queryByText('5ms')).toBeInTheDocument();
    });

    waitFor(
      () => {
        // Assert column not in document
        expect(screen.queryByText('Time Range')).not.toBeInTheDocument();
        expect(screen.queryByText(input)).not.toBeInTheDocument();

        // Assert columns are in document
        expect(screen.queryByText('Annotation')).toBeInTheDocument();
        expect(screen.queryByText('Frequency Range')).toBeInTheDocument();
        expect(screen.queryByText('BW')).toBeInTheDocument();
        expect(screen.queryByText('Label')).toBeInTheDocument();
        expect(screen.queryByText('Duration')).toBeInTheDocument();
        expect(screen.queryByText('Actions')).toBeInTheDocument();
      },
      { timeout: 1000000 }
    );
  });

  test('Display correct data on initial view', async () => {
    //Arrange
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));
    nock('http://localhost:3000')
      .get('/api/datasources/testaccount/testcontainer/test_file_path/meta')
      .reply(200, meta);

    // Act
    render(<AnnotationList setCurrentFFT={() => {}} currentFFT={0}></AnnotationList>, {
      wrapper: ({ children }) => (
        <AllProviders>
          <SpectrogramContextProvider
            account={'testaccount'}
            container={'testcontainer'}
            filePath={'test_file_path'}
            type={'api'}
          >
            {children}
          </SpectrogramContextProvider>
        </AllProviders>
      ),
    });

    // Assert
    waitFor(() => {
      expect(screen.queryByText('883.275')).toBeInTheDocument();
      expect(screen.queryByText('884.625')).toBeInTheDocument();
      expect(screen.queryByText('1.35MHz')).toBeInTheDocument();
      expect(screen.queryByText('LTE')).toBeInTheDocument();
      expect(screen.queryByText('2022-03-17T16:43:30.0025Z')).toBeInTheDocument();
      expect(screen.queryByText('2022-03-17T16:43:30.0075Z')).toBeInTheDocument();
      expect(screen.queryByText('5ms')).toBeInTheDocument();
    });
  });

  test.each`
    input                          | label                               | type            | expected                                                              | number
    ${'0'}                         | ${'Annotation 0 - Frequency Start'} | ${'spinbutton'} | ${'Frequency must be greater than the minimum frequency of the file'} | ${1}
    ${'8888'}                      | ${'Annotation 0 - Frequency Start'} | ${'spinbutton'} | ${'Frequency must be less than the maximum frequency of the file'}    | ${2}
    ${'0'}                         | ${'Annotation 0 - Frequency End'}   | ${'spinbutton'} | ${'Frequency must be greater than the minimum frequency of the file'} | ${3}
    ${'8888'}                      | ${'Annotation 0 - Frequency End'}   | ${'spinbutton'} | ${'Frequency must be less than the maximum frequency of the file'}    | ${4}
    ${'2022-03-17T16:42:30.0000Z'} | ${'Annotation 0 - Start Time'}      | ${'textbox'}    | ${'Date must be after start of the file'}                             | ${5}
    ${'2022-03-17T16:45:30.0000Z'} | ${'Annotation 0 - Start Time'}      | ${'textbox'}    | ${'Date must be before end of the file'}                              | ${6}
    ${'Invalid date'}              | ${'Annotation 0 - Start Time'}      | ${'textbox'}    | ${'Invalid date'}                                                     | ${7}
    ${'2022-03-17T16:42:30.0000Z'} | ${'Annotation 0 - End Time'}        | ${'textbox'}    | ${'Date must be after start of the file'}                             | ${8}
    ${'2022-03-17T16:45:30.0000Z'} | ${'Annotation 0 - End Time'}        | ${'textbox'}    | ${'Date must be before end of the file'}                              | ${9}
    ${'Invalid date'}              | ${'Annotation 0 - End Time'}        | ${'textbox'}    | ${'Invalid date'}                                                     | ${10}
  `('Annotation errors display correctly on tab escape', async ({ input, label, type, expected }) => {
    //Arrange
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));
    nock('http://localhost:3000')
      .get('/api/datasources/testaccount/testcontainer/test_file_path/meta')
      .reply(200, meta);

    render(<AnnotationList setCurrentFFT={() => {}} currentFFT={0}></AnnotationList>, {
      wrapper: ({ children }) => (
        <AllProviders>
          <SpectrogramContextProvider
            account={'testaccount'}
            container={'testcontainer'}
            filePath={'test_file_path'}
            type={'api'}
          >
            {children}
          </SpectrogramContextProvider>
        </AllProviders>
      ),
    });

    // Act
    const start = await screen.findByRole(type, { name: label });
    waitFor(
      () => {
        expect(screen.queryByText(expected)).not.toBeInTheDocument();
      },
      { timeout: 1000000 }
    );

    await act(async () => {
      await userEvent.clear(start);
      await userEvent.type(start, input);
      await userEvent.tab();
    });

    waitFor(
      () => {
        // Assert
        expect(screen.queryAllByText(expected)[0]).toBeInTheDocument();
      },
      { timeout: 1000000 }
    );
  });

  test.each`
    input                          | label                               | type            | expected                                                              | number
    ${'0'}                         | ${'Annotation 0 - Frequency Start'} | ${'spinbutton'} | ${'Frequency must be greater than the minimum frequency of the file'} | ${1}
    ${'8888'}                      | ${'Annotation 0 - Frequency Start'} | ${'spinbutton'} | ${'Frequency must be less than the maximum frequency of the file'}    | ${2}
    ${'0'}                         | ${'Annotation 0 - Frequency End'}   | ${'spinbutton'} | ${'Frequency must be greater than the minimum frequency of the file'} | ${3}
    ${'8888'}                      | ${'Annotation 0 - Frequency End'}   | ${'spinbutton'} | ${'Frequency must be less than the maximum frequency of the file'}    | ${4}
    ${'2022-03-17T16:42:30.0000Z'} | ${'Annotation 0 - Start Time'}      | ${'textbox'}    | ${'Date must be after start of the file'}                             | ${5}
    ${'2022-03-17T16:45:30.0000Z'} | ${'Annotation 0 - Start Time'}      | ${'textbox'}    | ${'Date must be before end of the file'}                              | ${6}
    ${'Invalid date'}              | ${'Annotation 0 - Start Time'}      | ${'textbox'}    | ${'Invalid date'}                                                     | ${7}
    ${'2022-03-17T16:42:30.0000Z'} | ${'Annotation 0 - End Time'}        | ${'textbox'}    | ${'Date must be after start of the file'}                             | ${8}
    ${'2022-03-17T16:45:30.0000Z'} | ${'Annotation 0 - End Time'}        | ${'textbox'}    | ${'Date must be before end of the file'}                              | ${9}
    ${'Invalid date'}              | ${'Annotation 0 - End Time'}        | ${'textbox'}    | ${'Invalid date'}                                                     | ${10}
  `('Annotation errors display correctly on enter', async ({ input, label, type, expected }) => {
    //Arrange
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));
    nock('http://localhost:3000')
      .get('/api/datasources/testaccount/testcontainer/test_file_path/meta')
      .reply(200, meta);

    render(<AnnotationList setCurrentFFT={() => {}} currentFFT={0}></AnnotationList>, {
      wrapper: ({ children }) => (
        <AllProviders>
          <SpectrogramContextProvider
            account={'testaccount'}
            container={'testcontainer'}
            filePath={'test_file_path'}
            type={'api'}
          >
            {children}
          </SpectrogramContextProvider>
        </AllProviders>
      ),
    });

    // Act

    const start = await screen.findByRole(type, { name: label });
    waitFor(
      () => {
        expect(screen.queryByText(expected)).not.toBeInTheDocument();
      },
      { timeout: 1000000 }
    );

    await act(async () => {
      await userEvent.clear(start);
      await userEvent.type(start, input + '[Enter]');
    });

    // Assert
    waitFor(
      () => {
        expect(screen.queryAllByText(expected)[0]).toBeInTheDocument();
      },
      { timeout: 1000000 }
    );
  });

  test.each`
    input    | label                               | type            | expected
    ${'883'} | ${'Annotation 0 - Frequency Start'} | ${'spinbutton'} | ${'883'}
  `('Annotation updates values correctly', async ({ input, label, type, expected }) => {
    //Arrange
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));
    nock('http://localhost:3000')
      .get('/api/datasources/testaccount/testcontainer/test_file_path/meta')
      .reply(200, meta);
    // Act
    render(<AnnotationList setCurrentFFT={() => {}} currentFFT={0}></AnnotationList>, {
      wrapper: ({ children }) => (
        <AllProviders>
          <SpectrogramContextProvider
            account={'testaccount'}
            container={'testcontainer'}
            filePath={'test_file_path'}
            type={'api'}
          >
            {children}
          </SpectrogramContextProvider>
        </AllProviders>
      ),
    });

    // Act
    expect(await screen.queryByText(expected)).not.toBeInTheDocument();

    const start = await screen.findByRole(type, { name: label });

    await act(async () => {
      await userEvent.clear(start);
      await userEvent.type(start, input);
      await userEvent.tab();
    });
    // Assert
    expect((await screen.findAllByText(expected))[0]).toBeInTheDocument();
  });

  test.each`
    input                         | key                       | value            | label                               | type            | expected
    ${'883'}                      | ${'core:freq_lower_edge'} | ${883000000}     | ${'Annotation 0 - Frequency Start'} | ${'spinbutton'} | ${883000000}
    ${'885'}                      | ${'core:freq_upper_edge'} | ${885000000}     | ${'Annotation 0 - Frequency End'}   | ${'spinbutton'} | ${885000000}
    ${'New Label'}                | ${'core:label'}           | ${'New Label'}   | ${'Annotation 0 - Label'}           | ${'textbox'}    | ${'New Label'}
    ${'2022-03-17T16:43:30.002Z'} | ${'core:sample_start'}    | ${10001}         | ${'Annotation 0 - Start Time'}      | ${'textbox'}    | ${10001}
    ${'2022-03-17T16:45:30.003Z'} | ${'core:sample_count'}    | ${10002}         | ${'Annotation 0 - End Time'}        | ${'textbox'}    | ${10002}
    ${'New Comment'}              | ${'core:comment'}         | ${'New Comment'} | ${'Annotation 0 - Comment'}         | ${'textbox'}    | ${'New Comment'}
  `('Annotation updates action value correctly on alteration', async ({ input, key, value, label, type, expected }) => {
    //Arrange
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));
    nock('http://localhost:3000')
      .get('/api/datasources/testaccount/testcontainer/test_file_path/meta')
      .reply(200, meta);

    // Act
    render(
      <AllProviders>
        <SpectrogramContextProvider
          account={'testaccount'}
          container={'testcontainer'}
          filePath={'test_file_path'}
          type={'api'}
        >
          <AnnotationList setCurrentFFT={() => {}} currentFFT={0}></AnnotationList>
        </SpectrogramContextProvider>
      </AllProviders>
    );

    // Act
    expect(await screen.queryByText(expected)).not.toBeInTheDocument();
    const start = await screen.findByRole(type, { name: label });
    await act(async () => {
      await userEvent.type(start, input);
      await userEvent.tab();
    });

    const openButton = await screen.findByLabelText('Annotation 0 Modal Open');
    await act(async () => {
      await userEvent.click(openButton);
    });

    // Assert
    waitFor(
      () => {
        const textarea = screen.queryByLabelText('Annotation 0', { selector: 'textarea' });
        expect(textarea.innerHTML).toContain(expected);
      },
      { timeout: 1000000 }
    );
  });

  test.each`
    key                       | label                               | type            | expected
    ${'core:freq_lower_edge'} | ${'Annotation 0 - Frequency Start'} | ${'spinbutton'} | ${860}
    ${'core:freq_upper_edge'} | ${'Annotation 0 - Frequency End'}   | ${'spinbutton'} | ${900}
  `('When no frequencies, display default value', async ({ key, label, type, expected }) => {
    //Arrange
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));
    delete meta.annotations[0][key];
    nock('http://localhost:3000')
      .get('/api/datasources/testaccount/testcontainer/test_file_path/meta')
      .reply(200, meta);

    // Act
    render(<AnnotationList setCurrentFFT={() => {}} currentFFT={0}></AnnotationList>, {
      wrapper: ({ children }) => (
        <AllProviders>
          <SpectrogramContextProvider
            account={'testaccount'}
            container={'testcontainer'}
            filePath={'test_file_path'}
            type={'api'}
          >
            {children}
          </SpectrogramContextProvider>
        </AllProviders>
      ),
    });

    // Assert
    const current = await screen.findByRole(type, { name: label });
    expect(current).toHaveValue(expected);
  });

  test.each`
    key                       | label                               | type            | expected
    ${'core:freq_lower_edge'} | ${'Annotation 0 - Frequency Start'} | ${'spinbutton'} | ${-20}
    ${'core:freq_upper_edge'} | ${'Annotation 0 - Frequency End'}   | ${'spinbutton'} | ${20}
  `('When no frequencies or center frequency, display default value', async ({ key, label, type, expected }) => {
    //Arrange
    const meta = Object.assign(new SigMFMetadata(), JSON.parse(JSON.stringify(metadataJson)));
    delete meta.annotations[0][key];
    delete meta.captures[0]['core:frequency'];
    nock('http://localhost:3000')
      .get('/api/datasources/testaccount/testcontainer/test_file_path/meta')
      .reply(200, meta);

    // Act
    render(<AnnotationList setCurrentFFT={() => {}} currentFFT={0}></AnnotationList>, {
      wrapper: ({ children }) => (
        <AllProviders>
          <SpectrogramContextProvider
            account={'testaccount'}
            container={'testcontainer'}
            filePath={'test_file_path'}
            type={'api'}
          >
            {children}
          </SpectrogramContextProvider>
        </AllProviders>
      ),
    });

    // Assert
    act(async () => {
      const current = await screen.findByRole(type, { name: label });
      expect(current).toHaveValue(expected);
    });
  });
});
