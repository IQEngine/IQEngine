![GitHub release](https://img.shields.io/github/v/release/IQEngine/IQEngine)
[![Discord](https://img.shields.io/discord/1063315697498853498?label=Discord)](https://discord.gg/k7C8kp3b76)
[![AUR](https://img.shields.io/github/license/IQEngine/IQEngine)](https://github.com/IQEngine/IQEngine/blob/main/LICENSE)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/IQEngine/IQEngine/badge)](https://securityscorecards.dev/viewer/?uri=github.com/IQEngine/IQEngine)
[![OpenSSF Best Practices](https://bestpractices.coreinfrastructure.org/projects/7730/badge)](https://bestpractices.coreinfrastructure.org/projects/7730)
[![Staging](https://img.shields.io/github/actions/workflow/status/IQEngine/IQEngine/periodic_test_of_staging.yml?label=staging)](https://staging.iqengine.org)
[![Prod](https://img.shields.io/github/actions/workflow/status/IQEngine/IQEngine/periodic_test_of_prod.yml?label=prod)](https://iqengine.org)
[![GitHub Sponsors](https://img.shields.io/github/sponsors/IQEngine)](https://github.com/sponsors/IQEngine)

<p align="center"><img width=250 src="client/public/IQEngine.svg#gh-dark-mode-only" /></p>
<p align="center"><img width=250 src="client/public/IQEngine_Black.svg#gh-light-mode-only" /></p>

<p align="center"><b><i>A web-based SDR toolkit for analyzing, processing, and sharing RF recordings</i></b></p>

<p align="center">🔎<b><i>Try it out at <a href="https://iqengine.org">iqengine.org</a></i></b>🔎</p>

IQEngine is a web application that powers <a href="https://iqengine.org">iqengine.org</a> but can also be deployed as a private instance to share recordings within a company/organization.  The public instance, <a href="https://iqengine.org">iqengine.org</a>, is used by thousands each month to browse RF recordings shared by the community, although you can also use the site to visualize your own local files (processing is done client-side).  It includes a spectrogram-based visualization and editor tool, built on top of the [SigMF](https://github.com/gnuradio/SigMF) standard.  Use IQEngine to expand your knowledge of wireless signals and how to analyze/process them, while learning more about FFTs, filtering, and other RF DSP.  IQEngine's goal is to bring the open-source RF community together.

IQEngine is rapidly evolving, so [sign up](https://dashboard.mailerlite.com/forms/299501/77960409531811734/share) for a once-a-month email update, including new features, demos, and more!  There is also an IQEngine [Discord](https://discord.gg/k7C8kp3b76) chat channel if you want to get involved in the development or have questions.

[Link to the live docs](https://staging.iqengine.org/docs) which can also be found in the source code at `client/src/pages/docs/***.mdx`

### List of Major Features:

* Spectrogram + time + freq + IQ plots with zooming and adjustable scales
* Table of all RF recordings available in a directory or blob storage account, with spectrogram thumbnails
* FIR filtering and arbitrary Python snippets prior to FFT, all client-side
* Time and frequency domain selection cursors to choose what gets sent to plots/plugins/downloads
* Configurable colormap
* Viewable/editable global params and annotations, including adding a new annotation graphically or through text
* Jump to annotation when you click it from the table
* Plugins, allowing DSP to run on the backend (currently supports Python and GNU Radio)
* Ability to search/query over millions of recordings by parsing metadata into database
* User/admin system for controlling access to certain recordings
* The IQEngine team created a new web library for performing FFTs and related functions, called [WebFFT](https://www.npmjs.com/package/webfft), you can play with it using the [demo here](https://webfft.com/)

<a href="https://star-history.com/#IQEngine/IQEngine&Date">
  <picture>
    <p align="center">
      <source media="(prefers-color-scheme: dark)" srcset="https://api.star-history.com/svg?repos=IQEngine/IQEngine&type=Date&theme=dark" />
      <source media="(prefers-color-scheme: light)" srcset="https://api.star-history.com/svg?repos=IQEngine/IQEngine&type=Date" />
      <img width="70%" alt="Star History Chart" src="https://api.star-history.com/svg?repos=IQEngine/IQEngine&type=Date" />
    </p>
  </picture>
</a>


### IQEngine is Supported By:

<p align="center"><img width=250 src="client/public/microsoft-logo.svg" /></p>

<p align="center"><a href="https://www.qoherent.ai/"><img width=250 src="client/public/clogo-black.png" /></a></p>

<p align="center"><img width=250 src="client/public/AIRBUS_white.png#gh-dark-mode-only" /></p>
<p align="center"><img width=250 src="client/public/AIRBUS_blue.png#gh-light-mode-only" /></p>
