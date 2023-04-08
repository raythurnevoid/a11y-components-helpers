/**
 * Handles input events on the combobox, for the specs check the following resources:
 * - for {@link State.autocomplete} `"list"` https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/#kbd_label
 * - for {@link State.autocomplete} `"both"` https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-both/#kbd_label
 * - for {@link State.autocomplete} `"none"` https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-none/#kbd_label
 */
export declare function handleComboboxInput(input: {
    state: State;
    event: InputEvent;
    hooks: {
        updateState: Hooks['updateState'];
        checkIfListboxCanOpen: Hooks['checkIfListboxCanOpen'];
        findOptionToActivate?: Hooks['findOptionToActivate'];
        showInlineSuggestion?: Hooks['showInlineSuggestion'];
        prepareOptions?: Hooks['prepareOptions'];
    };
}): Promise<void>;
/**
 * Handles keydown events on the combobox, for the specs check the following resources:
 * - for {@link State.autocomplete} `"list"` https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-list/#kbd_label
 * - for {@link State.autocomplete} `"both"` https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-both/#kbd_label
 * - for {@link State.autocomplete} `"none"` https://www.w3.org/WAI/ARIA/apg/patterns/combobox/examples/combobox-autocomplete-none/#kbd_label
 */
export declare function handleComboboxKeyDown(input: {
    state: State;
    event: KeyboardEvent;
    /**
     * The value of the combobox.
     */
    value: string;
    hooks: {
        updateState: Hooks['updateState'];
        checkIfListboxCanOpen: Hooks['checkIfListboxCanOpen'];
        getPreviousOption: Hooks['getPreviousOption'];
        getNextOption: Hooks['getNextOption'];
        findOptionToActivate?: Hooks['findOptionToActivate'];
        prepareOptions?: Hooks['prepareOptions'];
        setComboboxValue?: Hooks['setComboboxValue'];
        showInlineSuggestion?: Hooks['showInlineSuggestion'];
        commitValue?: Hooks['commitValue'];
    };
}): Promise<void>;
/**
 * Set the combobox as the element with visual focus.
 *
 * @param input
 */
export declare function handleComboboxFocus(input: {
    state: State;
    hooks: {
        updateState: Hooks['updateState'];
    };
}): Promise<void>;
/**
 * Open the listbox if needed and set the active option when there's a match with the user input.
 * Set the combobox as the element with visual focus.
 *
 * @param input
 */
export declare function handleComboboxClick(input: {
    state: State;
    hooks: {
        updateState: Hooks['updateState'];
        checkIfListboxCanOpen: Hooks['checkIfListboxCanOpen'];
        prepareOptions?: Hooks['prepareOptions'];
        findOptionToActivate?: Hooks['findOptionToActivate'];
    };
}): Promise<void>;
/**
 * Prevent the default behavior of the event, calls stopPropagation() and preventDefault() on the event.
 *
 * @param input
 */
export declare function handleComboboxChange(input: {
    event: Event;
}): Promise<void>;
/**
 * Toggle listbox open/closed state and move the focus to the combobox element.
 */
export declare function handleButtonClick(input: {
    state: State;
    hooks: {
        updateState: Hooks['updateState'];
        checkIfListboxCanOpen: Hooks['checkIfListboxCanOpen'];
        focusCombobox?: Hooks['focusCombobox'];
        prepareOptions?: Hooks['prepareOptions'];
        findOptionToActivate?: Hooks['findOptionToActivate'];
    };
}): Promise<void>;
/**
 * Close the listbox if needed.
 */
export declare function handleRootFocusOut(input: {
    state: State;
    event: FocusEvent;
    rootEl: HTMLElement;
    /**
     * The value of the combobox input element (eventually including inline suggestion).
     */
    value: string;
    hooks: {
        updateState: Hooks['updateState'];
        commitValue?: Hooks['commitValue'];
    };
}): Promise<void>;
/**
 * Select the option, close the listbox and move the focus to the combobox element.
 *
 * @param input
 */
export declare function handleOptionClick(input: {
    state: State;
    /**
     * The value of the combobox (only what the user has typed).
     */
    value: string;
    /**
     * The clicked option.
     */
    option: string;
    hooks: {
        updateState: Hooks['updateState'];
        setComboboxValue?: Hooks['setComboboxValue'];
        focusCombobox?: Hooks['focusCombobox'];
        commitValue?: Hooks['commitValue'];
    };
}): Promise<void>;
/**
 * Close the listbox if needed.
 */
export declare function handleBackgroundPointerUp(input: {
    state: State;
    event: Event;
    rootEl: HTMLElement;
    hooks: {
        updateState: Hooks['updateState'];
    };
}): Promise<void>;
/**
 * Programmatically close the listbox.
 */
export declare function close(input: {
    state: State;
    force: boolean;
    hooks: {
        updateState: Hooks['updateState'];
    };
}): Promise<State>;
/**
 * Programmatically open the listbox.
 */
export declare function open(input: {
    state: State;
    hooks: {
        updateState: Hooks['updateState'];
        checkIfListboxCanOpen?: Hooks['checkIfListboxCanOpen'];
        prepareOptions?: Hooks['prepareOptions'];
        findOptionToActivate?: Hooks['findOptionToActivate'];
    };
}): Promise<State>;
/**
 * Helps to correctly assign aria attributes to your elements for the given state.
 */
export declare function getA11yAttributes(input: {
    state: State;
    activeOptionId: string | null;
}): {
    button: {
        "aria-expanded": "true" | "false";
    };
    combobox: {
        "aria-expanded": "true" | "false";
        "aria-activedescendant": string;
    };
    activeOption: {
        "aria-selected": "true";
    };
    otherOptions: {
        "aria-selected": "false";
    };
};
/**
 * List of this component capabilities for the given state, can be used to help you implement custom logics.
 */
export declare function getBehavior(state: State): {
    /**
     * When `true` the options in the listbox should be updated accordingly to the user input.
     *
     * When `false` the options in the listbox should be static and not change.
     */
    canFilterOptionsInListbox: boolean;
    /**
     * When `true` the current active option should be set as combobox value and inline suggestions should be shown on user input.
     *
     * When `false` the user input should be preserved until the user selects an option.
     */
    canShowInlineSuggestions: boolean;
};
/**
 * Helps to instantiate the state while providing types intellisense.
 */
export declare function setState(state: State): State;
/**
 * Helps to instantiate the hooks while providing types intellisense.
 */
export declare function setHooks(hooks: Hooks): Hooks;
interface UpdateStateInputInternal {
    /**
     * The patch to apply to the state.
     */
    state: Partial<State>;
}
export interface UpdateStateInput extends UpdateStateInputInternal {
    /**
     * The reason why {@link Hooks.updateState} is called.
     *
     * Can be used to implement custom logics.
     */
    reason: UpdateStateReason;
}
type UpdateStateReason = 'root pointerover' | 'root pointerout' | 'root focusout' | 'combobox input: insert' | 'combobox input: delete' | 'combobox keydown: ArrowDown' | 'combobox keydown: ArrowDown: filter match' | 'combobox keydown: ArrowDown: filter doesnt match' | 'combobox keydown: ArrowUp' | 'combobox keydown: ArrowUp: filter match' | 'combobox keydown: ArrowUp: filter doesnt match' | 'combobox keydown: Enter' | 'combobox keydown: Esc' | 'combobox keydown: Tab' | 'combobox focus' | 'combobox blur' | 'combobox click' | 'combobox click: filter match' | 'combobox click: filter doesnt match' | 'button click' | 'button click: filter match' | 'button click: filter doesnt match' | 'option click' | 'background pointerup' | 'close' | 'open' | 'open: filter match' | 'open: filter doesnt match';
export type setComboboxValueReason = 'combobox keydown: Enter' | 'combobox keydown: Tab' | 'combobox keydown: Esc' | 'combobox keydown: ArrowDown' | 'combobox keydown: ArrowUp' | 'option click';
export type ClearComboboxReason = 'combobox keydown: Esc';
export type FocusComboboxReason = 'button click' | 'option click';
export type ShowInlineSuggestionReason = 'combobox input: insert' | 'combobox input: delete';
export type FindOptionToActivatenReason = 'combobox input: insert' | 'combobox input: delete' | 'combobox keydown: ArrowDown' | 'combobox keydown: ArrowUp' | 'combobox click' | 'button click' | 'open';
export type GetNextOptionReason = 'combobox keydown: ArrowDown';
export type GetPreviousOptionReason = 'combobox keydown: ArrowUp';
export type CheckIfListboxCanOpenReason = 'button click' | 'combobox input: insert' | 'combobox input: delete' | 'combobox click' | 'combobox keydown: ArrowUp' | 'combobox keydown: ArrowDown' | 'open';
export type PrepareOptionsReason = 'combobox input: insert' | 'combobox input: delete' | 'combobox keydown: ArrowDown' | 'combobox keydown: ArrowUp' | 'combobox click' | 'button click' | 'open';
export type CommitValueReason = 'combobox change' | 'combobox keydown: Enter' | 'combobox keydown: Tab' | 'combobox keydown: Esc' | 'option click' | 'root focusout';
export interface Hooks {
    /**
     * Called when the state should be updated.
     * This method is called only when a value is changed to avoid unnecessary calls.
     * This method is called only with the properties that changed allowing the user to check for a specific property.
     */
    updateState: (input: UpdateStateInput) => Promise<State>;
    /**
     * Called to check if the listbox can be opened.
     * When `false` is returned, the listbox won't be opened and all the logics related to the opening will be skipped
     *
     * Eg: When returns `false` on `keydown ArrowDown` the hooks related the {@link prepareOptions} hook won't be called.
     *
     * @returns `true` if the listbox can be opened, `false` otherwise.
     */
    checkIfListboxCanOpen: (input: {
        /**
         * The reason why {@link checkIfListboxCanOpen} checked.
         *
         * Can be used to implement custom logics.
         */
        reason: CheckIfListboxCanOpenReason;
    }) => Promise<boolean>;
    /**
     * Called before running logics related to the options.
     * Can be used to fetch data and/or filter the options.
     *
     * `false` shall be returned when the options failed to prepare for instance because of a network error or because no options are available for the current user input.
     *
     * When `false` is returned, all the logics related to the options will be skipped.
     *
     * Eg: When returns `false` on `keydown ArrowDown` {@link getNextOption} hook won't be called.
     *
     * **Note**: The listbox is not closed automatically because you may want to show a message in the listbox in place of the options.
     * *If you want want to close the listbox when the options are not ready, you have to manually update the state.*
     *
     * @returns `true` if the options are ready. `false` otherwise.
     *
     */
    prepareOptions?: (input: {
        /**
         * The reason why {@link prepareOptions} is called.
         *
         * Can be used to implement custom logics.
         */
        reason: PrepareOptionsReason;
    }) => Promise<boolean>;
    /**
     * Allows to provide the previous option to activate on `keydown ArrowUp`.
     *
     * When `null` is returned, no option will be activated and {@link State.activeOption} will be set to `null`.
     *
     * @returns The previous option to activate or `null` if there is no previous option.
     */
    getPreviousOption: (input: {
        /**
         * The current active option.
         */
        option: State['activeOption'];
        /**
         * The reason why {@link getPreviousOption} is called.
         *
         * Can be used to implement custom logics.
         */
        reason: GetPreviousOptionReason;
    }) => Promise<string | null | undefined>;
    /**
     * Allows to provide the next option to activate on `keydown ArrowDown`.
     *
     * When `null` is returned, no option will be activated and {@link State.activeOption} will be set to `null`.
     *
     * @returns The next option to activate or `null` if there is no next option.
     */
    getNextOption: (input: {
        /**
         * The current active option.
         */
        option: State['activeOption'];
        /**
         * The reason why {@link getNextOption} is called.
         *
         * Can be used to implement custom logics.
         */
        reason: GetNextOptionReason;
    }) => Promise<string | null | undefined>;
    /**
     * Called to check if there's an option to activate that match the current user input when the listbox is opened.
     *
     * @returns The option to activate or `null` if there's no option to activate.
     */
    findOptionToActivate?: (input: {
        /**
         * The reason why {@link findOptionToActivate} is called.
         *
         * Can be used to implement custom logics.
         */
        reason: FindOptionToActivatenReason;
    }) => Promise<string | null | undefined>;
    /**
     * Called when an option is selected or when the user wants to clear the combobox by pressing `Esc`.
     *
     * The combobox value must be updated accordingly.
     *
     * When {@link State.autocomplete} is `both` this methos is called on `keydown ArrowDown` and `keydown ArrowUp` to update the combobox value.
     */
    setComboboxValue?: (input: {
        /**
         * The value of the selected option or an empty string in case the user pressed `Esc` to clear the combobox.
         */
        value: string;
        /**
         * The reason why {@link setComboboxValue} is called.
         *
         * Can be used to implement custom logics.
         */
        reason: setComboboxValueReason;
    }) => Promise<void>;
    /**
     * Called when the DOM focus must be moved to the combobox when a click occurs on the button.
     */
    focusCombobox?: (input: {
        /**
         * The reason why {@link focusCombobox} is called.
         *
         * Can be used to implement custom logics.
         */
        reason: FocusComboboxReason;
    }) => Promise<void>;
    /**
     * Called when an inline suggestion should show on the combobox, it happens only when autocomplete is `both`.
     */
    showInlineSuggestion?: (input: {
        /**
         * The reason why {@link showInlineSuggestion} is called.
         *
         * Can be used to implement custom logics.
         */
        reason: ShowInlineSuggestionReason;
    }) => Promise<void>;
    /**
     * Called when the change event is expected to be triggered.
     */
    commitValue?: (input: {
        /**
         * The reason why {@link commitValue} is called.
         *
         * Can be used to implement custom logics.
         */
        reason: CommitValueReason;
    }) => Promise<void>;
}
export interface State {
    /**
     * The of autocompletition to apply.
     *
     * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-autocomplete
     */
    autocomplete: 'none' | 'both' | 'list' | 'inline';
    /**
     * Define the open/closed state of the listbox.
     */
    isListboxOpen: boolean;
    /**
     * The element that has the focus.
     */
    elementWithFocus: 'combobox' | 'listbox' | null;
    /**
     * The currently active option.
     *
     * Can be used to apply some highlighting on the element.
     */
    activeOption: string | null;
}
export {};
