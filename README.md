# jQuery XHR Upload Queue

jQuery plugin that creates a queued file uploading framework that implements [XMLHttpRequest Level 2](http://www.w3.org/TR/XMLHttpRequest/), the [FileAPI](http://www.w3.org/TR/FileAPI/), and the [Drag and Drop API](http://www.w3.org/TR/html5/dnd.html).

## Summary
This plugin creates a file uploading queue that will asynchronously upload files via the web browser using an XMLHttpRequest. It will automatically hook drag and drop events to accept file drops, form submit events (if the selected element is a form), and change events to any file select form fields found.

It is up to you to build the UI and implement the events via callbacks through the plugin.

### Features
* Drag-and-drop file handling
* Progress bars
* Multiple concurrent uploads
* Uploads can be aborted while in progress
* First-in-first-out queue
* Not dependant on Flash or Silverlight
* Lightweight and memory efficient
* Works with large files
* No dependencies other than jQuery core (1.7+).
* Entirely free and open source.

## Usage
You'll find using this plugin a bit more complicated than some of the other options, since this plugin doesn't build the UI for you.

### Base Plugin
```javascript
$('#myUploadForm').xhrUploadQueue(options);
```

Where `options` is an object with the various settings and plugin callbacks (all defined below).

### Example
Here is a very basic example using the plugin:

#### HTML
```html
<form id="uploadform">
	<div id="filelist"></div>
	<input type="submit" value="Upload Files" />
</form>
```

#### JavaScript
```javascript
$('#myUploadForm').xhrUploadQueue({
	postUrl: '/path/to/upload.json.php',

	queueAdd: function(file) {
		// setup file transmit detail view
		var fileUploadStatus = $([
			'<div class="uploaditem">',
			'	<p class="filename">' + file.name + '</p>',
			'	<p class="filestatus">0%</p>',
			'	<progress class="fileprogress" max="' + file.size + '" value="0"></progress>',
			'</div>'].join(''));
		var progressBar = fileUploadStatus.find('progress'),
			percentText = fileUploadStatus.find('.filestatus'),
			moreInfo = fileUploadStatus.find('.transferrate');

		// add the detail view to the file list
		$('#filelist').append(fileUploadStatus);

		// hook file transmit events
		file.progress(function(event, bps) {
			progressBar.attr('value', event.loaded);
			percentText.text(Math.round(event.loaded / event.total * 100) + '%');
		});
		file.endSend(function(response) {
			progressBar.attr('value', progressBar.attr('max'));
			statusText.text('Upload complete!');
			alert('Upload complete: ' + file.name);
		});
		file.sendFail(function(jqXHR, status) {
			percentText.text('FAILED');
			alert('Upload failed: ' + file.name + ' - ' + status);
		});
	}
});
```

#### What this code does
* Setup the plugin on the `#myUploadForm` element, which in this example is a form.
* Set the `postUrl` option and the `queueAdd` callback.
* When a file is added to the queue (via file input or drag and drop) it will create a new `#uploaditem` div with the file name, upload status, and progress bar.
* It hooks the `progress`, `endSend`, and `sendFail` callbacks on the file to update the status text, progress bar, and alert the user when the upload finishes or fails.

Since `#myUploadForm`  is a form, the plugin will hook the submit event to trigger the upload process so you don't have to set it up manually.

## Options
### System Settings
| Name | Default | Type | Description |
| ----- | ----- | ----- | ----- |
| maximumQueueSize | 10 | Number | Maximum number of files to let the user queue for upload. |
| maximumFileSize | 1048576 | Number |  Maximum size of files accepted, in bytes. |
| uploadConcurrency | 2 | Number |  Number of parallel uploads to run. |
| acceptedMimeTypes | []| Array |  MIME types to accept for upload. This accepts the same MIME names as the HTML5 accept attribute. (e.g. 'video/*', 'image/png'). Leave blank to accept all types. |
| postUrl | 'upload.php' | String |  URL to post the AJAX requests to. |
| filesInputName | 'filesinput' | String | Field name to use for the file in the AJAX post. |
| hookDragAndDrop | true | Boolean |  Enable or disable drag and drop. |
| customFormData | null | Object | Form data to send with the AJAX post. Example `{ field1: 'field value', field2: 'another value' }`. |
| silenceZeroByteErrors | true | Boolean | Enable or disable sending errors about zero-byte files (i.e. folders) to the ` handleUnacceptedFiles` callback. |

### Class Names
| Name | Default | Type | Description |
| ----- | ----- | ----- | ----- |
| hoverClass | 'draghover' | String | Class name to attach to the matched element when a drag and drop hover is in progress. Note that the `:hover` CSS pseudo class is not triggered for drag and drop hovers. |
| fullSupportClass | 'fullsupport' | String | Class name for full feature support. |
| noSupportClass | 'nosupport' | String | Class name for no feature support. |
| noFilesAPIClass | 'nofilesapi' | String | Class name for no FileAPI support. |
| noXHR2Class | 'noxhr2' | String | Class name for no XHR2 support. |

### Callbacks
| Name | Default | Type | Description |
| ----- | ----- | ----- | ----- |
| init | $.noop | Function | Initialization callback. This callback will only be invoked if the plugin has detected full feature support. |
| queueAdd | $.noop | Function | File added to queue callback. |
| queueChange | $.noop | Function | Queue changed (file added or removed). |
| queueRemove | $.noop | Function | File removed from queue callback. |
| uploadStart | $.noop | Function | Begin upload of queued files. |
| uploadFinish | $.noop | Function | End upload of queued files. |
| handleUnacceptedFiles | $.noop | Function | Handle unaccepted files callback. |
| noSupport | $.noop | Function | No support callback. This callback will only be invoked if the plugin has detected that it does not have full feature support. |
| processFileList | function(files) { return files; } | Function | Custom file pre-filtering code. This will get executed on the FileList before it gets filtered by the normal filters. This function must return an array of files to add to the queue. |

## Callback Details
The plugin makes all of its magic happen via callbacks. Wherever possible it tries for follow the jQuery pattern for naming and attaching callbacks. You will be placing your callbacks in the options object defined above.

### Plugin Callbacks
These callback are all either associated to the base plugin functions or its FileQueue functions. You set them directly in the options object passed to `xhrUpload()`.

* **init()** This happens once for each matched element. This callback will only be invoked if the plugin has detected the browser features needed for full support.
* **queueAdd(FileUpload)** This happens to every individual file added to the queue, and this is where most of your development will likely take place. It passes the FileUpload object of the file that has been added to the queue, exposing it so you can hook individual events for each file.
* **queueChange()** This callback is invoked any time the queue changes.
* **queueRemove(FileUpload)** This happens whenever a file is manually removed from the queue.
* **uploadStart()** This callback is invoked when the process of sending the queued files begins.
* **uploadFinish()** This callback is invoked when all files have finished uploading (even if they all failed or were aborted).
* **handleUnacceptedFiles(FileUploads)** This callback is invoked when the user has attempted to add files that were not accepted because they are too large, not an accepted MIME type, the queue is full, or, if the ` silenceZeroByteErrors` option is set to false, when the file is zero bytes in size. It passes an array of FileUploads with the error property set to the appropriate FileError.
* **noSupport()** This callback is invoked if the script has not detected the features necessary to operate. This can only happen once per ` xhrUpload()` call, no matter how many matched elements were selected.
* **processFileList(FileUploads)** This is a hook that allows you to do custom pre-filtering of the file list, before the list gets filtered by the regular size, MIME, and queue limit code. This callback must return the list of files that you want to have added to the queue.

### FileUpload Callbacks
Since file specific functionality is often unique to each individual file and file uploads a handled one file at a time, the callbacks are attached directly to the FileUpload object. This makes building the interface a little easier and lets you take better advantage of closures.

You attach your callbacks to the file using methods on the FileUpload object (e.g. `file.endSend(function(data) { /* … */ })`).

* **beginSend** This callback is invoked when the file begins uploading.
* **progress** This callback is invoked when an XHR progress event occurs. It passes the raw event as well as the calculated bytes-per-second transfer rate.
* **endSend** This callback is invoked when the upload is successfully completed. It passes the response from the [jqXHR](http://api.jquery.com/jQuery.ajax/#jqXHR).
* **sendFail** This callback is invoked when the upload fails or is aborted. It passes the [jqXHR](http://api.jquery.com/jQuery.ajax/#jqXHR) object and the status.

The `endSend` and `sendFail` callbacks are basically hooked into the `.done` and `.fail` [jqXHR callbacks](http://api.jquery.com/jQuery.ajax/#callback-functions) and pass the same arguments.

## Custom Objects
There are a couple custom objects used to simplify and abstract the work happening in the plugin as well as standardize the data it sends to the callbacks.

### FileQueue Object
This is the heart of the plugin, an object that manages the queue. All of the base plugin callbacks execute in the context of their FileQueue so you can access this object with the `this` keyword. It is also referenced in `.data('fileQueue')` of the element the plugin was run on.

#### Properties
* **length** The count of FileUploads currently in the upload queue.
* **totalBytesInQueue** The total number of bytes in the queue (sum of all files queued).

#### Public methods
* **addFiles(FileList)** Attempts to add a list of File objects to the queue. Will run them through the normal filtering for size, type, and queue limit).
* **removeFile(FileUpload)** Removes the specified FileUpload from the queue.
* **emptyQueue()** Removes all files from the queue.
* **beginUpload()** Begins the queue file uploading process.

### FileUpload Object
This is the object you will have to interact with the most. The `queueAdd` and `queueRemove` callbacks both receive a FileUpload object as an argument, and the `handleUnacceptedFiles` and `processFileList` callbacks both receive an array of FileUpload objects as an argument.

This object exposes several properties and methods that you will need to build your file upload interface.

#### Properties
* **name** The name of the file.
* **type** The MIME type of the file.
* **size** The size of the file in bytes.
* **file** The original File object.
* **error** The FileError if the file was rejected by the size, MIME type, or queue limit filtering, otherwise `null`.

#### Callback hooking methods
* **beginSend(callback())** Callback to execute when the upload begins.
* **progress(callback(progressEvent, bytesPerSecond))** Callback to execute when a progress event occurs.
* **endSend(callback(responseData))** Callback to execute when the upload completes.
* **sendFail(callback(jqXHR, status))** Callback to execute when the upload fails or is aborted.

#### Public methods
* **cancelUpload()** Aborts an in-progress upload.
* **removeFromQueue()** Removes the file from the upload queue.

### FileError Enumeration
The FileError enum is attached to a FileUpload's error property when that file is not accepted into the queue. You can use this enumeration to check what caused the file to be rejected. It is public and available at `$.fn.xhrUpload.FileError`. It has the following values `QUEUE_FULL`, `FILE_TOO_LARGE`, `UNACCEPTED_MIME_TYPE`, and `ZERO_BYTE_FILE`.

## Browser Support
Full support for this plugin requires a browser that supports both FileAPI and XMLHttpRequest Level 2. Currently the browsers that meet the requirements for full support are Firefox, Chrome, Safari, Opera, Opera Mobile and Android Browser. Current versions of Internet Explorer, iOS Safari, and Opera Mini do not support the needed features. The next major version of Internet Explorer will support these features.

### Desktop
Except for the usual Internet Explorer failure, the latest versions of all modern desktop browsers fully support this plugin.

| Browser | Version | Status |
| ----- | ----- | ----- |
| Mozilla Firefox | 3.6+ | Full support in current version |
| Google Chrome | 7.0+ | Full support in current version |
| Apple Safari | 5.1+ | Full support in current version |
| Opera | 12.0+ | Full support in current version* |
| Microsoft Internet Explorer | 10+ | **Not supported in current version** |

**Opera support is very recent. Version 12 was released on June 14th, 2012. Opera also has the unique quirk of alerting the user with a message box when they try to drag and drop files to a page.*

### Mobile
Mobile support is less promising. Most notably missing is iOS, which is lacking the FileAPI and has no estimate of when that feature will be implemented.

| Browser | Version | Status |
| ----- | ----- | ----- |
| Google Android Browser | 3.0+ | Full support in current version |
| Opera Mobile | 12+ | Full support in current version |
| Apple iOS Safari | N/A | **Not supported (No FileAPI)** |
| Opera Mini | N/A | **Not supported (No FileAPI or XHR2)** |

### Browser support by feature
* [FileAPI](http://caniuse.com/fileapi)
* [XHR2](http://caniuse.com/xhr2)
* [Drag and Drop](http://caniuse.com/dragndrop)

### Graceful Degradation
When the plugin is running on a browser that doesn't support advanced features it will add the `nosupport` class to the element it runs on. Using only CSS and a few extra lines of markup it is very simple to implement a standard file input form that will show up for those users. It won't have the glitz and glamour of the advanced form, but it is very easy to use.

## Project Goal
The goal of this project is to provide a free, simple, extensible, fast, and future-proof file uploading framework with no 3rd party dependencies (other than jQuery core) that leaves the implementation details in the hands of the developer using the plugin.

Thanks to the HTML5 push, browser based uploads no longer have to suck, or depend on 3rd party browser plugins. With the introduction of the FIleAPI and XMLHttpRequest Level 2 we can now have rich uploads using only native HTML and JavaScript. Moving forward, all browsers will fully support these new technologies and all of the cumbersome hacks we've had to do (like Flash, Silverlight, and iframes) will become deprecated.

## Similar Projects
There are other JavaScript file upload projects that are worth taking a look at and may better suit your needs.

* [jQuery File Upload Plugin](https://github.com/blueimp/jQuery-File-Upload)
* [Ajax Upload](https://github.com/valums/file-uploader)
* [Plupload](https://github.com/moxiecode/plupload)
* [jQuery filedrop plugin](https://github.com/weixiyen/jquery-filedrop)
* [jQuery Multiple File Upload Plugin](https://code.google.com/p/jquery-multifile-plugin/)

## License
*(This project is released under the [MIT license](https://raw.github.com/stevenbenner/jquery-xhr-upload-queue/master/LICENSE.txt).)*

Copyright (c) 2012 Steven Benner, http://stevenbenner.com/

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.