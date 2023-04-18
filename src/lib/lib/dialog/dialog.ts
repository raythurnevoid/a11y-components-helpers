/**
 * Helps to correctly assign aria attributes to your elements for the given state.
 */
export function getA11yAttributes(input: {
	/**
	 * Whether the modal is used to show an alert.
	 *
	 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Roles/alertdialog_role
	 */
	alert: boolean;
}) {
	return {
		role: input.alert ? 'alertdialog' : 'dialog'
	};
}
