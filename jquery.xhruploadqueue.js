/**
 * XHR Upload Queue
 *
 * @fileoverview  jQuery plugin that creates a queued file uploading framework.
 * @link          https://github.com/stevenbenner/jquery-xhr-upload-queue
 * @author        Steven Benner (http://stevenbenner.com/)
 * @version       1.0.0
 * @requires      jQuery 1.7+
 *
 * @license jQuery XHR Upload Queue Plugin v1.0.0
 * https://github.com/stevenbenner/jquery-xhr-upload-queue
 * Copyright 2013 Steven Benner (http://stevenbenner.com/)
 * Released under the MIT license.
 * <https://raw.github.com/stevenbenner/jquery-xhr-upload-queue/master/LICENSE.txt>
 */

(function($, window, undefined) {
	'use strict';

	// detect features
	var isFilesAPIAvailable = window.FileReader !== undefined,
		isXHR2Available = new window.XMLHttpRequest().upload !== undefined;

	/**
	 * Builds and hooks the plugin system.
	 * @param {Object} opts The options object to use for the plugin.
	 * @return {Object} jQuery object for the matched selectors.
	 */
	$.fn.xhrUploadQueue = function(opts) {

		// don't do any work if there were no matched elements
		if (!this.length) {
			return this;
		}

		// extend options
		var options = $.extend({}, $.fn.xhrUploadQueue.defaults, opts);

		// test for FilesAPI and XHR2 support
		// and setup feature support classes
		if (!isFilesAPIAvailable || !isXHR2Available) {
			this.removeClass(options.fullSupportClass);
			this.addClass(options.noSupportClass);
			if (!isFilesAPIAvailable) {
				this.addClass(options.noFilesAPIClass);
			}
			if (!isXHR2Available) {
				this.addClass(options.noXHR2Class);
			}
			// we cant do anything without these features
			options.noSupport.call();
			return this;
		}
		this.addClass(options.fullSupportClass);

		// apply to every matched element
		return this.each(function() {

			var $this = $(this),
				fileQueue = new FileQueue(options);

			// add data reference to the FileQueue
			$this.data('fileQueue', fileQueue);

			// execute the init callback
			options.init.call(fileQueue);

			// hook drag and drop event handlers
			if (options.hookDragAndDrop === true) {
				$this.on({
					dragenter: function(event) {
						stopEvent(event);
						$this.addClass(options.hoverClass);
						return false;
					},
					dragover: function(event) {
						stopEvent(event);
						$this.addClass(options.hoverClass);
						return false;
					},
					dragleave: function(event) {
						stopEvent(event);
						$this.removeClass(options.hoverClass);
						return false;
					},
					drop: function(event) {
						stopEvent(event);
						$this.removeClass(options.hoverClass);
						fileQueue.addFiles(event.originalEvent.dataTransfer.files);
					}
				});
			}

			// hook change event to any file inputs
			// and set the accept attribute
			if ($this.is('input[type=file]')) {
				$this.on('change', function() {
					fileQueue.addFiles(this.files);
				});
				if (options.acceptedMimeTypes.length > 0) {
					$this.attr('accept', options.acceptedMimeTypes.join(','));
				}
			} else {
				var fileInputs = $this.find('input[type=file]');
				fileInputs.on('change', function() {
					fileQueue.addFiles(this.files);
				});
				if (options.acceptedMimeTypes.length > 0) {
					fileInputs.attr('accept', options.acceptedMimeTypes.join(','));
				}
			}

			// hook form submit
			if ($this.is('form')) {
				$this.on('submit', function() {
					fileQueue.beginUpload();
					return false;
				});
			}

		});

	};

	/**
	 * Default options for the plugin.
	 * @type Object
	 */
	$.fn.xhrUploadQueue.defaults = {

		// system settings
		maximumQueueSize: 10,
		maximumFileSize: 1048576,
		uploadConcurrency: 2,
		acceptedMimeTypes: [],
		postUrl: 'upload.php',
		filesInputName: 'filesinput',
		hookDragAndDrop: true,
		customFormData: null,
		silenceZeroByteErrors: true,

		// class names
		hoverClass: 'draghover',
		fullSupportClass: 'fullsupport',
		noSupportClass: 'nosupport',
		noFilesAPIClass: 'nofilesapi',
		noXHR2Class: 'noxhr2',

		// callbacks
		init: $.noop,
		queueAdd: $.noop,
		queueChange: $.noop,
		queueRemove: $.noop,
		handleUnacceptedFiles: $.noop,
		uploadStart: $.noop,
		uploadFinish: $.noop,
		noSupport: $.noop,
		processFileList: function(files) {
			return files;
		}

	};

	/**
	 * Enumeration of file errors.
	 * @enum {String}
	 */
	$.fn.xhrUploadQueue.FileError = {
		QUEUE_FULL: 'The upload queue is full',
		FILE_TOO_LARGE: 'The file is too large',
		UNACCEPTED_MIME_TYPE: 'That type of file is not accepted',
		ZERO_BYTE_FILE: 'File is empty, or is a folder'
	};

	/**
	 * Creates a new file queue.
	 * @private
	 * @constructor
	 * @this {FileQueue}
	 * @param {Object} options Options object containing settings and callbacks.
	 */
	function FileQueue(options) {

		// instance variables
		var files = [],
			acceptAllFileTypes = options.acceptedMimeTypes.length === 0,
			typeRegEx = new RegExp(options.acceptedMimeTypes.join('|')),
			uploadsInProgress = 0,
			me = this;

		// public properties
		me.length = 0;
		me.totalBytesInQueue = 0;

		// public methods

		/**
		 * Adds one or more files to the queue.
		 * @public
		 * @param {Array.<File>} files Array of FileAPI File objects to add to the queue.
		 */
		me.addFiles = function(fileList) {
			var fileUploadList,
				skippedFiles = [],
				queueLength = me.length;

			// create list of FileUpload objects
			fileUploadList = $.map(fileList, function(file) {
				return new FileUpload(file, me, processNextFile);
			});

			// invoke the processFileList callback on the fileUploadList
			fileUploadList = options.processFileList.call(me, fileUploadList);

			// process file list
			fileUploadList = $.grep(fileUploadList, function(file) {

				// dont accept zero-byte files (and folders)
				// option to fail silently because zero-byte files are almost
				// always folders
				if (file.size === 0 && options.silenceZeroByteErrors === false) {
					file.error = $.fn.xhrUploadQueue.FileError.ZERO_BYTE_FILE;
					skippedFiles.push(file);
					return false; // grep fail
				}

				// dont accept files with extension that arn't explicitly accepted
				if (!acceptAllFileTypes && !typeRegEx.test(file.type)) {
					file.error = $.fn.xhrUploadQueue.FileError.UNACCEPTED_MIME_TYPE;
					skippedFiles.push(file);
					return false; // grep fail
				}

				// dont accept files larget than the max byte limit
				if (file.size >= options.maximumFileSize) {
					file.error = $.fn.xhrUploadQueue.FileError.FILE_TOO_LARGE;
					skippedFiles.push(file);
					return false; // grep fail
				}

				// limit queue
				if (queueLength >= options.maximumQueueSize) {
					file.error = $.fn.xhrUploadQueue.FileError.QUEUE_FULL;
					skippedFiles.push(file);
					return false; // grep fail
				}

				// grep pass
				queueLength++;
				return true;

			});

			// invoke the handleUnacceptedFiles if there were unaccepted files
			if (skippedFiles.length > 0) {
				options.handleUnacceptedFiles.call(me, skippedFiles);
			}

			// add the files to the queue
			$.each(fileUploadList, function(idx, file) {
				files.push(file);
				me.length = files.length;
				me.totalBytesInQueue += file.size;
				options.queueAdd.call(me, file);
				options.queueChange.call(me);
			});
		};

		/**
		 * Removes a file from the queue.
		 * @public
		 * @param {FileUpload} file The FileUpload to remove from the queue.
		 */
		me.removeFile = function(file) {
			var i = 0;
			for (i = 0; i < files.length; i++) {
				if (files[i] === file) {
					files.splice(i, 1);
					me.length = files.length;
					me.totalBytesInQueue -= file.size;
					options.queueRemove.call(me, file);
					options.queueChange.call(me);
					return true;
				}
			}
			return false;
		};

		/**
		 * Removes all files from the queue.
		 * @public
		 */
		me.emptyQueue = function() {
			files = [];
			me.length = 0;
			me.totalBytesInQueue = 0;
			options.queueChange.call(me);
		};

		/**
		 * Starts uploading the queued files in order. Will run multiple
		 * concurrent transfers as specified in the uploadConcurrency option.
		 * @public
		 */
		me.beginUpload = function() {
			// do not do anything if an upload is already in progress
			if (me.isUploadInProgress()) {
				return;
			}
			options.uploadStart.call(me);
			var concurrent = options.uploadConcurrency;
			uploadsInProgress = concurrent;
			while (concurrent-- > 0) {
				processNextFile();
			}
		};

		/**
		 * Checks if the queue is currently uploading files.
		 * @public
		 * @return {Boolean}
		 */
		me.isUploadInProgress = function() {
			return uploadsInProgress > 0;
		};

		// private methods

		/**
		 * Starts the upload for the next file in the queue.
		 * Used as the doneCallback for FileUploads.
		 * @private
		 */
		function processNextFile() {
			uploadsInProgress--;
			var nextFile = getNextFile();
			if (nextFile) {
				uploadsInProgress++;
				nextFile.uploadFile(
					options.postUrl,
					options.filesInputName,
					options.customFormData
				);
				return true;
			}
			if (uploadsInProgress === 0) {
				options.uploadFinish.call(me);
			}
			return false;
		}

		/**
		 * Gets the next file in the queue.
		 * @private
		 */
		function getNextFile() {
			var nextFile = files.shift();
			if (nextFile) {
				me.length = files.length;
				me.totalBytesInQueue -= nextFile.size;
				options.queueChange.call(me);
			}
			return nextFile;
		}
	}

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

	/**
	 * Cancels an event.
	 * @private
	 * @param {Object} event The event object to cancel.
	 */
	function stopEvent(event) {
		event.stopPropagation();
		event.preventDefault();
	}

}(jQuery, window));
