/*
 *   This content is licensed according to the W3C Software License at
 *   https://www.w3.org/Consortium/Legal/2015/copyright-software-and-document
 */

export class ComboboxAutocomplete {
	private comboboxHasVisualFocus: boolean = false;
	private listboxHasVisualFocus: boolean = false;

	private hasHover: boolean = false;

	private isNone: boolean = false;
	private isList: boolean = false;
	private isBoth: boolean = false;

	#selectedOption: string | null = null;

	#filteredOptions: string[] = [];
	private filter: string = '';

	constructor(
		private comboboxNode: HTMLInputElement,
		private buttonNode: HTMLButtonElement,
		private listboxNode: HTMLDataListElement,
		private props: {
			options: string[];
			updateOption: (data: {
				option: string;
				attributes: {
					'aria-selected': 'true' | 'false';
				};
			}) => void;
			updateCombobox: (data: {
				attributes: {
					'aria-activedescendant': string;
				};
			}) => void;
			getOptionElId: (data: { option: string }) => string;
			filterOptions(data: { filter: string }): void;
			setSelectedOption(data: { option: string | null }): void;
			isOptionInView(data: { option: string }): boolean;
			isFilterMatching(data: { filter: string; option: string }): boolean;
			setComboboxValue(data: { value: string }): void;
		}
	) {
		setTimeout(() => this.init()); // TODO: to fix
	}

	async init() {
		var autocomplete = this.comboboxNode.getAttribute('aria-autocomplete');

		if (typeof autocomplete === 'string') {
			autocomplete = autocomplete.toLowerCase();
			this.isNone = autocomplete === 'none';
			this.isList = autocomplete === 'list';
			this.isBoth = autocomplete === 'both';
		} else {
			// default value of autocomplete
			this.isNone = true;
		}

		this.comboboxNode.addEventListener('keydown', this.onComboboxKeyDown.bind(this));
		this.comboboxNode.addEventListener('keyup', this.onComboboxKeyUp.bind(this));
		this.comboboxNode.addEventListener('click', this.onComboboxClick.bind(this));
		this.comboboxNode.addEventListener('focus', this.onComboboxFocus.bind(this));
		this.comboboxNode.addEventListener('blur', this.onComboboxBlur.bind(this));

		document.body.addEventListener('pointerup', this.onBackgroundPointerUp.bind(this), true);

		// initialize pop up menu

		this.listboxNode.addEventListener('pointerover', this.onListboxPointerover.bind(this));
		this.listboxNode.addEventListener('pointerout', this.onListboxPointerout.bind(this));

		await this.filterOptions();

		// Open Button

		var button = this.comboboxNode.nextElementSibling;

		if (button && button.tagName === 'BUTTON') {
			button.addEventListener('click', this.onButtonClick.bind(this));
		}
	}

	get filteredOptions() {
		return this.#filteredOptions;
	}

	set filteredOptions(filteredOptions: string[]) {
		this.#filteredOptions = filteredOptions;
	}

	get selectedOption() {
		return this.#selectedOption;
	}

	set selectedOption(selectedOption: string | null) {
		this.#selectedOption = selectedOption;
	}

	get firstOption() {
		return this.filteredOptions.at(0) ?? null;
	}

	get lastOption() {
		return this.filteredOptions.at(-1) ?? null;
	}

	isOptionInView(option: string) {
		return this.props.isOptionInView({ option });
	}

	async setActiveDescendant(option: string) {
		if (option && this.listboxHasVisualFocus) {
			await this.props.updateCombobox({
				attributes: { 'aria-activedescendant': await this.props.getOptionElId({ option }) }
			});
			if (!this.isOptionInView(option)) {
				option.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
			}
		} else {
			this.props.updateCombobox({ attributes: { 'aria-activedescendant': '' } });
		}
	}

	async setValue(value: string) {
		this.filter = value;
		await this.props.setComboboxValue({ value });
		this.comboboxNode.setSelectionRange(value.length, value.length);
		await this.filterOptions();
	}

	async setOption(option: string | null, flag: boolean) {
		if (option) {
			await this.props.setSelectedOption({ option });
			await this.setCurrentOptionStyle(this.selectedOption);
			await this.setActiveDescendant(this.selectedOption ?? '');

			if (this.isBoth) {
				await this.props.setComboboxValue({ value: this.selectedOption ?? '' });
				if (flag) {
					this.comboboxNode.setSelectionRange(
						this.selectedOption.length,
						this.selectedOption.length
					);
				} else {
					this.comboboxNode.setSelectionRange(this.filter.length, this.selectedOption.length);
				}
			}
		}
	}

	async setVisualFocusCombobox() {
		this.listboxNode.classList.remove('focus');
		this.comboboxNode.parentNode.classList.add('focus'); // set the focus class to the parent for easier styling
		this.comboboxHasVisualFocus = true;
		this.listboxHasVisualFocus = false;
		await this.setActiveDescendant(false);
	}

	async setVisualFocusListbox() {
		this.comboboxNode.parentNode.classList.remove('focus');
		this.comboboxHasVisualFocus = false;
		this.listboxHasVisualFocus = true;
		console.log(this.listboxHasVisualFocus);
		this.listboxNode.classList.add('focus');
		await this.setActiveDescendant(this.selectedOption);
	}

	async removeVisualFocusAll() {
		this.comboboxNode.parentNode.classList.remove('focus');
		this.comboboxHasVisualFocus = false;
		this.listboxHasVisualFocus = false;
		this.listboxNode.classList.remove('focus');
		this.props.setSelectedOption({ option: null });
		await this.setActiveDescendant(false);
	}

	// ComboboxAutocomplete Events

	async filterOptions() {
		// TODO: refactor
		// do not filter any options if autocomplete is none
		if (this.isNone) {
			this.filter = '';
		}

		let option: string | null = null;
		var currentOption = this.selectedOption;

		await this.props.filterOptions({ filter: this.filter });

		// Use populated options array to initialize firstOption and lastOption.
		if (this.#filteredOptions.length > 0) {
			if (currentOption && this.#filteredOptions.indexOf(currentOption) >= 0) {
				option = currentOption;
			} else {
				option = this.firstOption;
			}
		} else {
			option = null;
		}

		return option;
	}

	async setCurrentOptionStyle(currentOption: string | null) {
		await this.#filteredOptions.map(async (option) => {
			await this.props.updateOption({
				option,
				attributes: {
					'aria-selected': option === currentOption ? 'true' : 'false'
				}
			});
		});
	}

	getPreviousOption(currentOption: string) {
		if (currentOption !== this.firstOption) {
			var index = this.#filteredOptions.indexOf(currentOption);
			return this.#filteredOptions[index - 1];
		}
		return this.lastOption;
	}

	getNextOption(currentOption: string) {
		if (currentOption !== this.lastOption) {
			var index = this.#filteredOptions.indexOf(currentOption);
			return this.#filteredOptions[index + 1];
		}
		return this.firstOption;
	}

	/* MENU DISPLAY METHODS */

	doesOptionHaveFocus() {
		return this.comboboxNode.getAttribute('aria-activedescendant') !== '';
	}

	isOpen() {
		return this.listboxNode.style.display === 'block';
	}

	isClosed() {
		return this.listboxNode.style.display !== 'block';
	}

	hasOptions() {
		return this.#filteredOptions.length;
	}

	open() {
		this.listboxNode.style.display = 'block';
		this.comboboxNode.setAttribute('aria-expanded', 'true');
		this.buttonNode.setAttribute('aria-expanded', 'true');
	}

	async close(force) {
		if (typeof force !== 'boolean') {
			force = false;
		}

		if (force || (!this.comboboxHasVisualFocus && !this.listboxHasVisualFocus && !this.hasHover)) {
			await this.setCurrentOptionStyle(null);
			this.listboxNode.style.display = 'none';
			this.comboboxNode.setAttribute('aria-expanded', 'false');
			this.buttonNode.setAttribute('aria-expanded', 'false');
			await this.setActiveDescendant(false);
			this.comboboxNode.parentNode.classList.add('focus');
		}
	}

	/* combobox Events */

	async onComboboxKeyDown(event) {
		var flag = false,
			altKey = event.altKey;

		if (event.ctrlKey || event.shiftKey) {
			return;
		}

		switch (event.key) {
			case 'Enter':
				if (this.listboxHasVisualFocus) {
					await this.setValue(this.selectedOption);
				}
				await this.close(true);
				await this.setVisualFocusCombobox();
				flag = true;
				break;

			case 'Down':
			case 'ArrowDown':
				if (this.#filteredOptions.length > 0) {
					if (altKey) {
						await this.open();
					} else {
						await this.open();
						if (this.listboxHasVisualFocus || (this.isBoth && this.#filteredOptions.length > 1)) {
							await this.setOption(await this.getNextOption(this.selectedOption), true);
							await this.setVisualFocusListbox();
						} else {
							await this.setOption(this.firstOption, true);
							await this.setVisualFocusListbox();
						}
					}
				}
				flag = true;
				break;

			case 'Up':
			case 'ArrowUp':
				if (await this.hasOptions()) {
					if (this.listboxHasVisualFocus) {
						await this.setOption(await this.getPreviousOption(this.selectedOption), true);
					} else {
						await this.open();
						if (!altKey) {
							await this.setOption(this.lastOption, true);
							await this.setVisualFocusListbox();
						}
					}
				}
				flag = true;
				break;

			case 'Esc':
			case 'Escape':
				if (await this.isOpen()) {
					await this.close(true);
					this.filter = this.comboboxNode.value;
					await this.filterOptions();
					await this.setVisualFocusCombobox();
				} else {
					await this.setValue('');
					await this.props.setComboboxValue({ value: '' });
				}
				this.props.setSelectedOption({ option: null });
				flag = true;
				break;

			case 'Tab':
				this.close(true);
				if (this.listboxHasVisualFocus) {
					if (this.selectedOption) {
						await this.setValue(this.selectedOption);
					}
				}
				break;

			case 'Home':
				this.comboboxNode.setSelectionRange(0, 0);
				flag = true;
				break;

			case 'End':
				var length = this.comboboxNode.value.length;
				this.comboboxNode.setSelectionRange(length, length);
				flag = true;
				break;

			default:
				break;
		}

		if (flag) {
			event.stopPropagation();
			event.preventDefault();
		}
	}

	isPrintableCharacter(str) {
		return str.length === 1 && str.match(/\S| /);
	}

	async onComboboxInput(event) {
		console.log(event);
		if (event.inputType.startsWith('insert')) {
			this.filter = this.comboboxNode.value;
		} else if (event.inputType.startsWith('delete')) {
			this.filter = this.comboboxNode.value;
			this.props.setSelectedOption({ option: null });
			await this.filterOptions();
		}
	}

	async onComboboxKeyUp(event) {
		console.log(event);
		let flag = false;
		let option: string | null = null;
		let char = event.key;

		//! moved in onComboboxInput
		// if (this.isPrintableCharacter(char)) {
		// 	this.filter = this.comboboxNode.value;
		// }

		//! moved in onComboboxInput
		// this is for the case when a selection in the textbox has been deleted
		// if (this.comboboxNode.value.length < this.filter.length) {
		// 	this.filter = this.comboboxNode.value;
		// 	this.props.setSelectedOption({ option: null });
		// 	await this.filterOptions();
		// }

		if (event.key === 'Escape' || event.key === 'Esc') {
			return;
		}

		switch (event.key) {
			case 'Backspace':
				await this.setVisualFocusCombobox();
				await this.setCurrentOptionStyle(null);
				this.filter = this.comboboxNode.value;
				await this.props.setSelectedOption({ option: null });
				await this.filterOptions();
				flag = true;
				break;

			case 'Left':
			case 'ArrowLeft':
			case 'Right':
			case 'ArrowRight':
			case 'Home':
			case 'End':
				if (this.isBoth) {
					this.filter = this.comboboxNode.value;
				} else {
					this.props.setSelectedOption({ option: null });
					await this.setCurrentOptionStyle(null);
				}
				await this.setVisualFocusCombobox();
				flag = true;
				break;

			default:
				if (await this.isPrintableCharacter(char)) {
					await this.setVisualFocusCombobox();
					await this.setCurrentOptionStyle(null);
					flag = true;

					if (this.isList || this.isBoth) {
						option = await this.filterOptions();

						if (option) {
							// TODO: refactor
							if ((await this.isClosed()) && this.comboboxNode.value.length) {
								await this.open();
							}

							if (await this.props.isFilterMatching({ filter: this.comboboxNode.value, option })) {
								await this.props.setSelectedOption({ option });
								if (this.isBoth || this.listboxHasVisualFocus) {
									if (this.listboxHasVisualFocus) {
										debugger; // TODO: this.listboxHasVisualFocus may not be needed here
									}
									await this.setCurrentOptionStyle(option);
									if (this.isBoth) {
										await this.setOption(option, false);
									}
								}
							} else {
								this.props.setSelectedOption({ option: null });
								await this.setCurrentOptionStyle(null);
							}
						} else {
							await this.close();
							await this.props.setSelectedOption({ option: null });
							await this.setActiveDescendant(false);
						}
					} else if (this.comboboxNode.value.length) {
						await this.open();
					}
				}

				break;
		}

		if (flag) {
			event.stopPropagation();
			event.preventDefault();
		}
	}

	async onComboboxClick() {
		if (this.isOpen()) {
			await this.close(true);
		} else {
			await this.open();
		}
	}

	async onComboboxFocus() {
		this.filter = this.comboboxNode.value;
		await this.filterOptions();
		await this.setVisualFocusCombobox();
		await this.props.setSelectedOption({ option: null });
		await this.setCurrentOptionStyle(null);
	}

	async onComboboxBlur() {
		await this.removeVisualFocusAll();
	}

	async onBackgroundPointerUp(event) {
		if (
			!this.comboboxNode.contains(event.target) &&
			!this.listboxNode.contains(event.target) &&
			!this.buttonNode.contains(event.target)
		) {
			this.comboboxHasVisualFocus = false;
			await this.setCurrentOptionStyle(null);
			await this.removeVisualFocusAll();
			setTimeout(this.close.bind(this, true), 300);
		}
	}

	async onButtonClick() {
		if (await this.isOpen()) {
			await this.close(true);
		} else {
			await this.open();
		}
		this.comboboxNode.focus();
		await this.setVisualFocusCombobox();
	}

	/* Listbox Events */

	onListboxPointerover() {
		this.hasHover = true;
	}

	onListboxPointerout() {
		this.hasHover = false;
		setTimeout(this.close.bind(this, false), 300);
	}

	// Listbox Option Events

	async onOptionClick(data: { option: string }) {
		await this.props.setComboboxValue({ value: data.option });
		await this.close(true);
	}

	async onOptionPointerover() {
		this.hasHover = true;
		await this.open();
	}

	onOptionPointerout() {
		this.hasHover = false;
		setTimeout(this.close.bind(this, false), 300);
	}
}
