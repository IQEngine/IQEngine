<p align="center">
  <img width=250 src="client/public/IQEngine_Black.svg" />
</p>

_<p align="center"><a href="https://www.iqengine.org">www.iqengine.org</a></p>_

<h4 style="text-align: center;"><i>A web-based SDR toolkit for analyzing, processing, and sharing RF recordings</i></h4>

* Spectrogram-based visualization and editor tool, built on SigMF
* Share your RF recordings or RFML datasets with others, without them having to download files or install any software
* IQEngine only fetches the portion of the samples you're viewing, allowing you to quickly browse very large RF recordings
* Test signal detection algorithms and visualize results
* Interactively learn about different Fourier and wavelet transforms and filters by applying them to interesting signals
* Organize and search through millions of RF recordings via metadata queries

Try IQEngine now using the canonical instance at [www.iqengine.org](http://iqengine.org/) hosted by [GNU Radio](https://www.gnuradio.org/) and connected to the official [SigMF](https://github.com/gnuradio/SigMF) examples repository.  You can use the same site to open local RF recordings, the processing is all done client-side.

IQEngine is rapidly evolving, so [sign up](https://dashboard.mailerlite.com/forms/299501/77960409531811734/share) for a once-a-month email update, including new features, demos, and more!  There is also an IQEngine [Discord](https://discord.gg/k7C8kp3b76) chat channel if you want to get involved in the development.  You may also contact Marc at iqengine@vt.edu for questions/comments/suggestions.

## Plugins

Through the optional backend API, IQEngine supports three different classes of plugins (signal generation is not yet released).  The signal detector (with optional classifier) can be triggered in the main spectrogram page, which will display the output annotations as soon as it finishes, convenient for testing new detection/classification algorithms.  The DSP module runs prior to the FFT calculations, letting you perform a variety of signal processing functions and other sample manipulation.  It currently only supports Python snippets, where the samples out must be the same length as samples in (for now).

<p align="center">
  <img width=450 src="client/public/plugins_concept.svg" />
</p>

## Local Install

(Note that there's no need to run your own instance of IQEngine, unless you are messing with the code, or want to use it in a sensitive environment.  The canonical instance at www.iqengine.org can be used to view local files or your private storage account.)

1. Install Node for your OS from https://nodejs.org/en/download/
2. `npm install`
3. Create an .env file using the example.env and paste in your SAS token for the container, or leave blank to do local-only
4. `npm start` to run app in development mode, it will auto-refresh when you change the code
5. Open local browser to the ip/port displayed in the terminal, typically http://localhost:3000/
6. (Optional, and likely not needed) `npm run build` to use production mode (e.g. to make sure all the deps still work when bundled).
    - You can serve the built files with:
    - `npm install -g serve`
    - `Set-ExecutionPolicy RemoteSigned -Scope CurrentUser`
    - `serve -s build`

## Docker Install

The IQEngine frontend is a React app and can be deployed many different ways, the canonical instance at iqengine.org is deployed in Azure using an App Service (serverless computing) with the Node stack, but if you prefer to run it containerized, here is an example to get you started:

```
docker build . -t iqengine
docker run -p 3000:3000 -d iqengine
```

The build step will take 3-5 minutes.  After running it you should be able to access IQEngine in a browser at http://localhost:3000/.

## Project Roadmap

The following roadmap highlights the past, current, and future work items across multiple (simultaneous) focus areas.  Not included in this list are ongoing efforts to make IQEngine valuable for use in education, as well as user experience (UX) improvements.

* Becoming the best analysis tool for raw RF recordings
  - [x] Spectrogram + time + freq + IQ plots with zooming and adjustable scales
  - [x] Filtering and arbitrary Python snippets prior to FFT
  - [x] Time domain cursors to select samples for other plots or to send to plugins
  - [ ] Frequency domain cursors and ability to extract region to a new file using tune-filter-decimate
  - [ ] Faster client-side FFTs (e.g., using a C webasm module + SIMD for the FFTs)
  - [ ] Configurable colormap
  - [ ] PFB channelizer or wavelet in place of FFT
* Becoming the ultimate SigMF visualization and editing tool
  - [x] Viewable/editable global params and annotations, including adding a new annotation
  - [ ] Ability to save changes to annotations/captures/global to the file
  - [ ] If you click an annotation in the table it jumps to that point in time in the spectrogram
  - [ ] Support for multiple captures
  - [ ] Zooming out in time with decimating to reduce data transferred to client
  - [ ] Ability to link to a specific point in time within a recording
  - [ ] Method of converting other common meta and data types to SigMF (e.g., recordings from test equipment)
* Extendable with Plugins (detection, classification, demod/decode, generic DSP)
  - [x] Example proof of concept for running plugins within IQEngine
  - [ ] Finalize and implement OpenAPI spec
  - [ ] Include examples of functioning plugins and templates for authors to follow
  - [ ] Ability for third-party hosted plugins to be made available to anyone
  - [ ] User/admin system for controlling access to certain plugins
* Adding value to RFML research and development
  - [x] A couple example signal detector plugins people can play with and a template
  - [ ] Allow existing RFML implementations to be supported by the IQEngine plugins API without excess work required
  - [ ] Colored annotation boxes
* Utility within spectrum awareness systems
  - [x] Table of all RF recordings available in a directory or blob storage account
  - [x] Spectrogram thumbnails
  - [ ] Ability to search/query over millions of recordings by parsing metadata into database
  - [ ] Maps based interface to show sensor location
  - [ ] Bandwidth stitching of multiple simultaneous recordings at different frequencies
  - [ ] User/admin system for controlling access to certain recordings

- [x] Indicates completed

## Azure App Service Config Notes

* Startup command needs to be `pm2 serve /home/site/wwwroot --spa --no-daemon`
* Node 16
* There needs to be a deployment slot called staging
* within the GitHub repository settings under Secrets and vars > Actions, there needs to be a Repository secret with AZUREAPPSERVICE_PUBLISHPROFILE...
* Connection settings live in GitHub Secrets > Actions (not Azure App Service anymore), enter it in without the outter double quotes and don't escape any quotes.

<p align="center"><h1>IQEngine is Supported By:</h1></p>

<p align="center"><img width=250 src="client/public/microsoft-logo.svg" /></p>

<p align="center"><a href="https://www.qoherent.ai/"><img width=250 src="client/public/clogo-black.png" /></a></p>