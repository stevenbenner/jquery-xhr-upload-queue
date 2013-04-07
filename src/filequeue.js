/**
 * XHR Upload Queue FileQueue
 *
 * @fileoverview  FileQueue object used to manage the upload queue.
 * @link          https://github.com/stevenbenner/jquery-xhr-upload-queue
 * @author        Steven Benner (http://stevenbenner.com/)
 * @requires      jQuery 1.7+
 */

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
			queueLength = me.length,
			totalBytes = 0;

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

			// dont accept a file that will surpass the queue byte limit
			if (options.maximumBytesInQueue && me.totalBytesInQueue + totalBytes + file.size > options.maximumBytesInQueue) {
				file.error = $.fn.xhrUploadQueue.FileError.QUEUE_FULL;
				skippedFiles.push(file);
				return false; //grep fail
			}

			// limit queue
			if (queueLength >= options.maximumQueueSize) {
				file.error = $.fn.xhrUploadQueue.FileError.QUEUE_FULL;
				skippedFiles.push(file);
				return false; // grep fail
			}

			// grep pass
			queueLength++;
			totalBytes += file.size;
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
