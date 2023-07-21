// Copyright (c) 2022 Microsoft Corporation
// Copyright (c) 2023 Marc Lichtman
// Licensed under the MIT License

import React from 'react';

const exampleMeta = `
{
  "global": {
    "core:datatype": "cf32_le",
    "core:sample_rate": 40000000,
    "core:hw": "PlutoSDR with whip antenna",
    "core:author": "Art Vandelay",
    "core:version": "1.0.0",
    "core:description": "Describe your signal/recording here"
  },
  "captures": [
    {
      "core:sample_start": 0,
      "core:frequency": 880000000,
      "core:datetime": "2022-03-17T16:43:30Z"
    }
  ],
  "annotations": [
    {
      "core:sample_start": 100000,
      "core:sample_count": 200000,
      "core:freq_upper_edge": 884625000,
      "core:freq_lower_edge": 883275000,
      "core:label": "LTE"
    },
    {
      "core:sample_start": 100000,
      "core:sample_count": 200000,
      "core:freq_upper_edge": 893520000,
      "core:freq_lower_edge": 884630000,
      "core:label": "LTE"
    },
    {
      "core:sample_start": 100000,
      "core:sample_count": 200000,
      "core:freq_upper_edge": 882244780,
      "core:freq_lower_edge": 880792266,
      "core:label": "CDMA"
    }
  ]
}
`;

export const SigMF = () => {
  return (
    <div className="mx-32">
      <h1 className="text-primary text-center">What is SigMF?</h1>
      <div className="columns-2">
        <p className="text-justify text-lg">
          The Signal Metadata Format (SigMF) specifies a way to describe sets of recorded digital signals with metadata
          written in JSON. It was designed for RF recordings, which consist of IQ samples. SigMF can be used to describe
          general information about the RF recording, the characteristics of the system that generated the samples, and
          features of the signal itself.
          <br></br>
          <br></br>
          By using SigMF instead of a bespoke solution, IQEngine and other tooling maintain interoperability with the
          same files, promoting sharing of recordings. The IQEngine{' '}
          <a href="https://discord.gg/k7C8kp3b76" target="_blank">
            Discord
          </a>{' '}
          contains a channel for discussion of any SigMF-related topics!
          <br></br>
          <br></br>
          <center>
            <a href="https://github.com/sigmf/SigMF" target="_blank">
              SigMF's GitHub
            </a>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <a href="https://github.com/sigmf/SigMF/blob/sigmf-v1.x/sigmf-spec.md" target="_blank">
              SigMF Specification
            </a>
            <br></br>
            <br></br>
            <img src="./sigmf_logo_cropped.gif" className="w-128 rounded-3xl" alt="SigMF animated logo" />
          </center>
        </p>

        <a href="./sigmf-diagram.svg">
          <img src="./sigmf-diagram.svg" className="m-3" alt="What is SigMF?" />
        </a>
        <br></br>
        <br></br>
      </div>

      {/* SigMF Summary */}
      <h1 className="text-primary text-center mt-16">SigMF in 5 Minutes</h1>
      <p className="text-lg">
        The SigMF{' '}
        <a href="https://github.com/sigmf/SigMF/blob/sigmf-v1.x/sigmf-spec.md" target="_blank">
          specifications document
        </a>{' '}
        is fairly long and difficult to skim, so the following is a summary of the important parts, leaving out the
        rarely used corner-cases.
        <br></br>
        <br></br>A single "SigMF Recording" consists of a binary file containing the IQ samples using either ints or
        floats, and a plaintext file containing the metadata using JSON as the format. They must be named xxx.sigmf-data
        and xxx.sigmf-meta respectively where xxx is the base file name, it can be whatever you want but it has to match
        between the two files; that is the SigMF way of saying they go together. If you have a receiver with multiple
        channels (e.g. a phased array or multiple polarizations), store each channel in a separate SigMF Recording, and
        then optionally you can choose to create a{' '}
        <a href="https://github.com/sigmf/SigMF/blob/sigmf-v1.x/sigmf-spec.md#sigmf-collection-format" target="_blank">
          .sigmf-collection
        </a>{' '}
        file to connect them all together, but it's also acceptable to simply include the subchannel number or
        polarization in the filename, and if there are a lot of channels you may put them in their own directory. The
        SigMF standard does <b>not</b> specify how to perform data compression (e.g., gzip), which means
        software/tooling that uses SigMF is unlikely going to be able to perform the decompression for you, so you can
        choose to do compression however you like. The general recommendation for binary IQ files is to not compress;
        before worrying about compression, first make sure that you are representing your RF recordings using the
        minimum bit depth, e.g., instead of float32 try int16 or even int8. If compressing your files leads to a large
        savings in space, then you probably could have achieved most of that gain by just using a lower bit depth in the
        first place. As such, it is most common to not use any data compression.
        <br></br>
        <br></br>
        The .sigmf-meta file containing JSON is made up of three parts:
        <ul className="list-disc px-16 my-4">
          <li>
            <b>global</b> - Contains datatype, SigMF version, sample_rate, description, and other optional fields such
            as the hardware used to make the recording. The datatype string indicates float (f), signed int (i),
            unsigned int (u) and examples include cf32_le for complex 32-bit floats (equivalent to numpy's complex64)
            and ci16_le for the common int16 using signed ints for each I and Q. The "c" means complex and the "_le"
            means little-endian, both of which are the standard for binary IQ files.
          </li>
          <li>
            <b>captures</b> - A list of "captures" where each capture includes the center (RF) frequency and
            sample_start, which is the sample index the capture starts on. Typically recordings will only have one
            capture, so sample_start will be 0 and the center frequency will be the important piece of information.
            Multiple captures are most commonly seen when you frequency hop within the same recording. The optional
            field datetime indicates the date and time corresponding to the start of each capture, using the ISO 8601
            format (e.g., 2022-03-17T16:43:30Z), letting you timestamp your RF recording.
          </li>
          <li>
            <b>annotations</b> - A list of "annotations" where each annotation is essentially a bounding box in time and
            frequency. Each annotation includes sample_start, sample_count, freq_lower_edge, freq_upper_edge. There are
            many other{' '}
            <a
              href="https://github.com/sigmf/SigMF/blob/sigmf-v1.x/sigmf-spec.md#annotation-segment-objects"
              target="_blank"
            >
              optional fields
            </a>{' '}
            such as lat/lon and label. The annotations list can be left empty, or it can be millions of annotations!
          </li>
        </ul>
        An example of a .sigmf-meta file is shown below:
        <pre className="text-base mx-32 mb-4">
          <div dangerouslySetInnerHTML={{ __html: exampleMeta }} />
        </pre>
        As you can see, it's fairly readable, but most importantly it's extremely machine readable and easy to parse!
        <br></br>
        <br></br>
        The core SigMF standard can support much more than what has been presented above, and for use-cases that it
        doesn't support, there may be a SigMF "extension" that does! SigMF extensions add functionality to SigMF, often
        specific to a certain type of RF application or protocol. Many extensions live within the SigMF{' '}
        <a href="https://github.com/sigmf/SigMF/tree/sigmf-v1.x/extensions">main repo</a> while others live in external
        repos, such as <a href="https://github.com/NTIA/sigmf-ns-ntia">NTIA's extensions.</a> As a quick example of why
        an extension might be useful, the{' '}
        <a href="https://github.com/sigmf/SigMF/blob/sigmf-v1.x/extensions/signal.sigmf-ext.md">Signal</a> extension is
        great for modulation/signal classification, as it adds optional fields within annotations that include
        enumerations for the standard modulation schemes, multiplexing schemes, spread spectrum, cellular types, etc.
        <br></br>
        <br></br>
        In addition to saving your RF recordings using the SigMF standard, you can use SigMF within your software, using
        one of four ways:
        <ul className="list-decimal px-16 my-4">
          <li>
            Within Python, using the official SigMF Python package{' '}
            <a href="https://github.com/sigmf/sigmf-python">sigmf</a> available from pip:{' '}
            <p className="font-mono inline ml-2">pip install sigmf</p>
          </li>
          <li>
            Within C++ using the header-only C++ library <a href="https://github.com/deepsig/libsigmf">libsigmf</a>{' '}
            maintained by DeepSig
          </li>
          <li>
            Within GNU Radio using the out-of-tree module <a href="https://github.com/skysafe/gr-sigmf">gr-sigmf</a>{' '}
            maintained by SkySafe
          </li>
          <li>
            Manually, i.e., by pulling out fields directly instead of using a library, which is the case within
            IQEngine.
          </li>
        </ul>
        By using SigMF to store and share your RF recordings, you can avoid dataset bitrot while promoting collaboration
        and interoperability!
      </p>

      {/* Schema */}
      <iframe src="./sigmf.html" className="w-full mt-8 mb-32" height="800"></iframe>
    </div>
  );
};
