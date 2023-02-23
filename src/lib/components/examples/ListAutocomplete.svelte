<script lang="ts">
	import { ComboboxAutocomplete } from '$lib/lib/combobox/list-autocomplete.js';
	import { onMount, tick } from 'svelte';
	import { notEmpty } from '../../lib/utils/array-filter-predicates.js';
	import './ListAutocomplete.css';

	export let autocomplete: 'list' | 'both' = 'list';

	let listbox: HTMLDataListElement;
	let button: HTMLButtonElement;
	let combobox: HTMLInputElement;

	let value: string = '';

	let comboboxA11yAttributes: { ['aria-activedescendant']: string } = {
		'aria-activedescendant': ''
	};

	let autocompleteI: ComboboxAutocomplete;

	let options: string[] = [
		'Alabama',
		'Alaska',
		'American Samoa',
		'Arizona',
		'Arkansas',
		'California',
		'Colorado',
		'Connecticut',
		'Delaware',
		'District of Columbia',
		'Florida',
		'Georgia',
		'Guam',
		'Hawaii',
		'Idaho',
		'Illinois',
		'Indiana',
		'Iowa',
		'Kansas',
		'Kentucky',
		'Louisiana',
		'Maine',
		'Maryland',
		'Massachusetts',
		'Michigan',
		'Minnesota',
		'Mississippi',
		'Missouri',
		'Montana',
		'Nebraska',
		'Nevada',
		'New Hampshire',
		'New Jersey',
		'New Mexico',
		'New York',
		'North Carolina',
		'North Dakota',
		'Northern Marianas Islands',
		'Ohio',
		'Oklahoma',
		'Oregon',
		'Pennsylvania',
		'Puerto Rico',
		'Rhode Island',
		'South Carolina',
		'South Dakota',
		'Tennessee',
		'Texas',
		'Utah',
		'Vermont',
		'Virgin Islands',
		'Virginia',
		'Washington',
		'West Virginia',
		'Wisconsin',
		'Wyoming'
	];
	let filteredOptions: string[] = options;

	let optionsWithDomAttributes = options.map((option) => {
		return {
			value: option,
			attributes: {
				'aria-selected': 'false' as 'false' | 'true'
			}
		};
	});

	$: filteredOptionsWithDomAttributes = filteredOptions
		.map((option) => {
			return optionsWithDomAttributes.find(
				(optionWithDomAttributes) => optionWithDomAttributes.value === option
			);
		})
		.filter(notEmpty);

	onMount(() => {
		autocompleteI = new ComboboxAutocomplete(combobox, button, listbox, {
			options,
			updateOption: async (data) => {
				const option = optionsWithDomAttributes.find((option) => option.value === data.option);

				if (!option) {
					return;
				}

				option.attributes = Object.assign(option.attributes, data.attributes);

				optionsWithDomAttributes = optionsWithDomAttributes;

				await tick();
				listbox.querySelector('[aria-selected=true]')?.scrollIntoView({
					block: 'nearest'
				});
			},
			updateCombobox: (data) => {
				comboboxA11yAttributes = data.attributes;
			},
			filterOptions: (data) => {
				filteredOptions = options.filter((option) =>
					option.toLowerCase().includes(data.filter.toLowerCase())
				);
				autocompleteI.filteredOptions = filteredOptions;
			},
			setSelectedOption: (data) => {
				autocompleteI.selectedOption = data.option;
			},
			isOptionInView: (data) => {
				const option = listbox.querySelector(`[value="${data.option}"]`);

				if (!option) {
					return false;
				}

				const bounding = option.getBoundingClientRect();
				// const listboxRect = listbox.getBoundingClientRect();

				return (
					bounding.top >= 0 &&
					bounding.left >= 0 &&
					bounding.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
					bounding.right <= (window.innerWidth || document.documentElement.clientWidth)
				);
			},
			isFilterMatching: (data) => {
				return data.option?.toLocaleLowerCase().startsWith(data.filter.toLowerCase());
			},
			getOptionElId: (data) => {
				return getOptionId(data.option);
			},
			setComboboxValue: (data) => {
				combobox.value = value = data.value;
			}
		});
	});

	function getOptionId(option: string) {
		return `cb1-option-${option}`;
	}
</script>

<div>
	{autocompleteI?.selectedOption}
	{value}
	<label for="cb1-input">State</label>
	<div class="combobox combobox-list">
		<div class="group">
			<input
				bind:this={combobox}
				id="cb1-input"
				class="cb_edit"
				{value}
				type="text"
				role="combobox"
				aria-autocomplete={autocomplete}
				aria-expanded="false"
				aria-controls="cb1-listbox"
				{...comboboxA11yAttributes}
				on:input={(e) => autocompleteI.onComboboxInput(e)}
			/>
			<button
				bind:this={button}
				id="cb1-button"
				tabindex="-1"
				aria-label="States"
				aria-expanded="false"
				aria-controls="cb1-listbox"
			>
				<svg
					width="18"
					height="16"
					aria-hidden="true"
					focusable="false"
					style="forced-color-adjust: auto"
				>
					<polygon
						class="arrow"
						stroke-width="0"
						fill-opacity="0.75"
						fill="currentcolor"
						points="3,6 15,6 9,14"
					/>
				</svg>
			</button>
		</div>
		<datalist bind:this={listbox} id="cb1-listbox" aria-label="States">
			{#each filteredOptionsWithDomAttributes as option}
				<option
					id={getOptionId(option.value)}
					value={option.value}
					{...option.attributes}
					on:click={() => autocompleteI.onOptionClick({ option: option.value })}
					on:pointerover={() => autocompleteI.onOptionPointerover()}
					on:pointerout={() => autocompleteI.onOptionPointerout()}
				>
					{option.value}
				</option>
			{/each}
		</datalist>
	</div>
</div>
