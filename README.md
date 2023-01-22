# IQEngine

<h4 style="text-align: center;"><i>Browse terabytes of RF recordings without having to install anything or download any files</i></h4>

* Analyze RF recordings
* Organize *lots* of RF recordings
* Test signal detection/classification algorithms and visualize results
* Education - play around with different Fourier and wavelet transforms and filters by applying them to interesting signals
* Share your RF recordings/datasets with others, without them having to download files or install software

Try IQEngine using [this instance at www.iqengine.org](http://iqengine.org/) hosted by GNU Radio and connected to the official SigMF examples repository.

IQEngine is a web app that provides a way to store, share, and analyze RF recordings.  You can view recordings stored on your local machine, or store them in Azure blob storage so that anyone with the credentials can view them.

IQEngine uses the SigMF standard for the metadata and annotations.  The main page of IQEngine is a listing of the SigMF recordings, either in a blob storage container or local directory, providing a quick glimpse of the recordings, using spectrogram thumbnails and metadata summary.  You can click on a recording to be brought into a spectrogram viewer, which is an interactive web-based viewer.  The user only downloads the portions they are viewing at any given time. 

No more downloading large zip files full of RF recordings and installing software. 

IQEngine also comes with signal detection algorithms that can automatically add annotations to an RF recording based on a few detection parameters such as threshold and minimum bandwidth.  

For those who have *lots* of RF recordings, IQEngine can automatically insert metadata into a MongoDB database when files are uploaded to blob storage.  You can then perform queries in the IQEngine web app.

IQEngine is a work in progress, check back again soon!

[Sign up for a once-a-month email update on IQEngine, such as new features, demos, and more!](https://dashboard.mailerlite.com/forms/299501/77960409531811734/share)

# Notes

Made with create-react-app https://create-react-app.dev/ under the hood it uses webpack (not Parcel!!!), Babel, ESLint, among other things 

## Install

(Should work on Windows or Linux)

1. Install Node from https://nodejs.org/en/download/
2. `npm install react-scripts`
3. Edit the .env file and paste in your SAS token for the container

## Run in dev mode

Run `npm start` to run app for development purpose, it will auto-refresh when you change the code

## Run in production mode

Run `npm run build` to use production mode (e.g. making sure all the deps still work when bundled), will go into the build dir

You can serve the built files with
```
npm install -g serve
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
serve -s build
```