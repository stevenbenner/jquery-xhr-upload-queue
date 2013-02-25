/**
 * XHR Upload Queue Functions
 *
 * @fileoverview  Private helper functions.
 * @link          https://github.com/stevenbenner/jquery-xhr-upload-queue
 * @author        Steven Benner (http://stevenbenner.com/)
 * @requires      jQuery 1.7+
 */

/**
 * Cancels an event.
 * @private
 * @param {Object} event The event object to cancel.
 */
function stopEvent(event) {
	event.stopPropagation();
	event.preventDefault();
}
