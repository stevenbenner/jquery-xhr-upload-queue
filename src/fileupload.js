/**
 * XHR Upload Queue FileUpload
 *
 * @fileoverview  FileUpload object represents a file and handles the upload.
 * @link          https://github.com/stevenbenner/jquery-xhr-upload-queue
 * @author        Steven Benner (http://stevenbenner.com/)
 * @requires      jQuery 1.7+
 */

/**
 * Creates a new file upload.
 * @private
 * @constructor
 * @this {FileUpload}
 * @param {Object} file FilesAPI File object to use.
 * @param {FileQueue} myQueue FileQueue that this file belongs to.
 * @param {Function} doneCallback Callback to execute when the upload finishes.
 */
function FileUpload(file, myQueue, doneCallback) {

	// instance variables
	var onBeginSend = $.noop,
		onProgress = $.noop,
		onEndSend = $.noop,
		onSendFail = $.noop,
		jqXHR = null,
		me = this;

	// public properties
	me.file = file;
	me.size = file.size;
	me.name = file.name;
	me.type = file.type;
	me.error = null;

	// public event hooking methods
	me.beginSend = function(callback) {
		onBeginSend = callback;
	};
	me.progress = function(callback) {
		onProgress = callback;
	};
	me.endSend = function(callback) {
		onEndSend = callback;
	};
	me.sendFail = function(callback) {
		onSendFail = callback;
	};

	// public methods

	/**
	 * Begins uploading this file. Do not call this directly.
	 * @public
	 * @param {String} postUrl The url to post the data too.
	 * @param {String} fieldName The form field name to associate the file with.
	 * @param {Object=} additionalFormData Additional form data to post.
	 */
	me.uploadFile = function(postUrl, fieldName, additionalFormData) {
		var fd = new window.FormData(),
			lastBytesLoaded = 0,
			lastTime = $.now();

		// invoke beginSend callback
		onBeginSend.call(me);

		// create FormData
		fd.append(fieldName, me.file);
		if (additionalFormData) {
			$.each(additionalFormData, function(name, value) {
				fd.append(name, value);
			});
		}

		// create AJAX request
		jqXHR = $.ajax({
			url: postUrl,
			data: fd,
			cache: false,
			contentType: false,
			processData: false,
			type: 'POST',
			xhr: function() {
				// create XHR and hook progress event
				var xhr = new window.XMLHttpRequest();
				xhr.upload.addEventListener('progress', function(event) {
					if (event.lengthComputable) {
						// compute transfer rate
						var curTime = $.now(),
							bytesRx = event.loaded - lastBytesLoaded,
							rxSeconds = (curTime - lastTime) / 1000,
							bytesPerSecond = bytesRx / rxSeconds;
						// save progress info
						lastTime = curTime;
						lastBytesLoaded = event.loaded;
						// execute callback
						onProgress.call(me, event, bytesPerSecond);
					}
				}, false);
				return xhr;
			}
		});

		// hook promise events
		jqXHR.done(function(response) {
			onEndSend.call(me, response);
		});
		jqXHR.fail(function(jqXHR, status) {
			onSendFail.call(me, jqXHR, status);
		});
		jqXHR.always(doneCallback);
	};

	/**
	 * Cancels an in-progress upload.
	 * @public
	 */
	me.cancelUpload = function() {
		if (jqXHR !== null) {
			jqXHR.abort();
		}
	};

	/**
	 * Removes this file from its queue.
	 * @public
	 */
	me.removeFromQueue = function() {
		myQueue.removeFile(me);
	};
}
