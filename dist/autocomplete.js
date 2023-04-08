async function handleComboboxInput(input) {
  let state = input.state;
  if (input.event.inputType.startsWith("insert") || input.event.inputType.startsWith("delete")) {
    input.event.preventDefault();
  } else {
    return;
  }
  let reason = `combobox input: ${input.event.inputType.startsWith("insert") ? "insert" : "delete"}`;
  state = await collectStateUpdates(
    state,
    async (updateState) => {
      if (state.elementWithFocus !== "combobox") {
        await updateState({
          state: {
            elementWithFocus: "combobox"
          }
        });
      }
      let listboxCanOpen = await input.hooks.checkIfListboxCanOpen({
        reason
      });
      if (listboxCanOpen) {
        if (!state.isListboxOpen) {
          await updateStateOnOpen({
            state,
            hooks: { updateState }
          });
        }
      }
    },
    async (statePatch) => {
      return await input.hooks.updateState({
        state: statePatch,
        reason
      });
    }
  );
  if (state.isListboxOpen) {
    const optionsAreReady = await input.hooks.prepareOptions?.({
      reason
    }) ?? true;
    if (!optionsAreReady)
      return;
  }
  if (input.hooks.findOptionToActivate) {
    const optionToActivate = await input.hooks.findOptionToActivate({
      reason
    });
    if (state.activeOption != optionToActivate) {
      state = await input.hooks.updateState({
        state: { activeOption: optionToActivate ?? null },
        reason
      });
    }
  }
  const behavior = getBehavior(state);
  if (behavior.canShowInlineSuggestions && state.activeOption && input.event.inputType.startsWith("insert") && input.hooks.showInlineSuggestion) {
    input.hooks.showInlineSuggestion({
      reason
    });
  }
}
async function handleComboboxKeyDown(input) {
  let state = input.state;
  let shouldPreventDefault = false;
  if (input.event.ctrlKey) {
    return;
  }
  if (input.event.shiftKey && input.event.key !== "Tab") {
    return;
  }
  switch (input.event.key) {
    case "Enter": {
      const currentActiveOption = state.activeOption;
      state = await collectStateUpdates(
        state,
        async (updateState) => {
          await updateStateOnClose({
            force: true,
            state,
            hooks: {
              updateState
            }
          });
          await updateState({
            state: {
              elementWithFocus: "combobox"
            }
          });
          if (input.hooks.setComboboxValue && currentActiveOption) {
            await input.hooks.setComboboxValue({
              value: currentActiveOption,
              reason: "combobox keydown: Enter"
            });
          }
          if (input.hooks.commitValue) {
            await input.hooks.commitValue({
              reason: "combobox keydown: Enter"
            });
          }
        },
        (state2) => input.hooks.updateState({
          state: state2,
          reason: "combobox keydown: Enter"
        })
      );
      shouldPreventDefault = true;
      break;
    }
    case "Down":
    case "ArrowDown": {
      let isActiveOptionChanged = false;
      const canContinue = state.isListboxOpen || await input.hooks.checkIfListboxCanOpen({
        reason: "combobox keydown: ArrowDown"
      });
      if (!canContinue)
        return;
      if (!state.isListboxOpen) {
        state = await collectStateUpdates(
          state,
          async (updateState) => {
            await updateStateOnOpen({
              state,
              hooks: {
                updateState
              }
            });
          },
          (state2) => input.hooks.updateState({
            state: state2,
            reason: "combobox keydown: ArrowDown"
          })
        );
        const optionsAreReady = await input.hooks.prepareOptions?.({
          reason: "combobox keydown: ArrowDown"
        }) ?? true;
        if (!optionsAreReady || input.event.altKey)
          return;
        if (input.hooks.findOptionToActivate) {
          const optionToActivate = await input.hooks.findOptionToActivate({
            reason: "combobox keydown: ArrowDown"
          });
          if (state.activeOption != optionToActivate) {
            isActiveOptionChanged = true;
            state = await input.hooks.updateState({
              state: { activeOption: optionToActivate ?? null },
              reason: "combobox keydown: ArrowDown"
            });
          }
        }
      }
      state = await collectStateUpdates(
        state,
        async (updateState) => {
          if (state.elementWithFocus !== "listbox") {
            await updateState({
              state: {
                elementWithFocus: "listbox"
              }
            });
          }
          const nextOption = await input.hooks.getNextOption({
            option: state.activeOption,
            reason: "combobox keydown: ArrowDown"
          });
          if (nextOption && nextOption !== state.activeOption) {
            await updateState({
              state: {
                activeOption: nextOption
              }
            });
            isActiveOptionChanged = true;
          }
        },
        (state2) => input.hooks.updateState({
          state: state2,
          reason: "combobox keydown: ArrowUp"
        })
      );
      const behavior = getBehavior(state);
      if (behavior.canShowInlineSuggestions && isActiveOptionChanged && state.activeOption) {
        input.hooks.setComboboxValue?.({
          value: state.activeOption,
          reason: "combobox keydown: ArrowDown"
        });
      }
      shouldPreventDefault = true;
      break;
    }
    case "Up":
    case "ArrowUp": {
      let isActiveOptionChanged = false;
      const canContinue = state.isListboxOpen || await input.hooks.checkIfListboxCanOpen({
        reason: "combobox keydown: ArrowDown"
      });
      if (!canContinue)
        return;
      if (!state.isListboxOpen) {
        state = await collectStateUpdates(
          state,
          async (updateState) => {
            await updateStateOnOpen({
              state,
              hooks: {
                updateState
              }
            });
          },
          (state2) => input.hooks.updateState({
            state: state2,
            reason: "combobox keydown: ArrowUp"
          })
        );
        const optionsAreReady = await input.hooks.prepareOptions?.({
          reason: "combobox keydown: ArrowUp"
        }) ?? true;
        if (!optionsAreReady || input.event.altKey)
          return;
        if (input.hooks.findOptionToActivate) {
          const optionToActivate = await input.hooks.findOptionToActivate({
            reason: "combobox keydown: ArrowUp"
          });
          if (state.activeOption != optionToActivate) {
            isActiveOptionChanged = true;
            state = await input.hooks.updateState({
              state: { activeOption: optionToActivate ?? null },
              reason: optionToActivate ? "combobox keydown: ArrowUp: filter match" : "combobox keydown: ArrowUp: filter doesnt match"
            });
          }
        }
      }
      state = await collectStateUpdates(
        state,
        async (updateState) => {
          if (state.elementWithFocus !== "listbox") {
            await updateState({
              state: {
                elementWithFocus: "listbox"
              }
            });
          }
          const prevOption = await input.hooks.getPreviousOption({
            option: state.activeOption,
            reason: "combobox keydown: ArrowUp"
          });
          if (prevOption && prevOption !== state.activeOption) {
            await updateState({
              state: {
                activeOption: prevOption
              }
            });
            isActiveOptionChanged = true;
          }
        },
        (state2) => input.hooks.updateState({
          state: state2,
          reason: "combobox keydown: ArrowUp"
        })
      );
      const behavior = getBehavior(state);
      if (behavior.canShowInlineSuggestions && isActiveOptionChanged && state.activeOption) {
        input.hooks.setComboboxValue?.({
          value: state.activeOption,
          reason: "combobox keydown: ArrowUp"
        });
      }
      shouldPreventDefault = true;
      break;
    }
    case "Esc":
    case "Escape": {
      state = await collectStateUpdates(
        state,
        async (updateState) => {
          if (state.isListboxOpen) {
            await updateStateOnClose({
              force: true,
              state,
              hooks: {
                updateState
              }
            });
            await updateState({
              state: {
                elementWithFocus: "combobox"
              }
            });
          } else if (input.value) {
            if (input.hooks.setComboboxValue) {
              await input.hooks.setComboboxValue({
                value: "",
                reason: "combobox keydown: Esc"
              });
            }
            if (input.hooks.commitValue) {
              await input.hooks.commitValue({
                reason: "combobox keydown: Esc"
              });
            }
          }
        },
        (state2) => input.hooks.updateState({
          state: state2,
          reason: "combobox keydown: Esc"
        })
      );
      shouldPreventDefault = true;
      break;
    }
    case "Tab": {
      const currentActiveOption = state.activeOption;
      state = await collectStateUpdates(
        state,
        async (updateState) => {
          await updateStateOnClose({
            force: true,
            state,
            hooks: {
              updateState
            }
          });
          if (input.hooks.setComboboxValue && currentActiveOption) {
            await input.hooks.setComboboxValue({
              value: currentActiveOption,
              reason: "combobox keydown: Tab"
            });
          }
          if (input.hooks.commitValue) {
            await input.hooks.commitValue({
              reason: "combobox keydown: Tab"
            });
          }
        },
        (state2) => input.hooks.updateState({
          state: state2,
          reason: "combobox keydown: Tab"
        })
      );
      break;
    }
  }
  if (shouldPreventDefault) {
    input.event.preventDefault();
  }
}
async function handleComboboxFocus(input) {
  await input.hooks.updateState({
    state: {
      elementWithFocus: "combobox"
    },
    reason: "combobox focus"
  });
}
async function handleComboboxClick(input) {
  let state = input.state;
  state = await collectStateUpdates(
    state,
    async (updateState) => {
      if (!state.isListboxOpen && await input.hooks.checkIfListboxCanOpen({
        reason: "combobox click"
      })) {
        await updateStateOnOpen({
          state,
          hooks: {
            updateState
          }
        });
      }
      if (state.elementWithFocus !== "combobox") {
        await updateState({
          state: {
            elementWithFocus: "combobox"
          }
        });
      }
    },
    (state2) => input.hooks.updateState({
      state: state2,
      reason: "combobox click"
    })
  );
  if (!state.isListboxOpen)
    return;
  const optionsAreReady = await input.hooks.prepareOptions?.({
    reason: "combobox click"
  }) ?? true;
  if (!optionsAreReady)
    return;
  if (input.hooks.findOptionToActivate) {
    const optionToActivate = await input.hooks.findOptionToActivate({
      reason: "combobox click"
    });
    if (state.activeOption != optionToActivate) {
      state = await input.hooks.updateState({
        state: { activeOption: optionToActivate ?? null },
        reason: optionToActivate ? "combobox click: filter match" : "combobox click: filter doesnt match"
      });
    }
  }
}
async function handleComboboxChange(input) {
  input.event.stopPropagation();
  input.event.preventDefault();
}
async function handleButtonClick(input) {
  let state = input.state;
  state = await collectStateUpdates(
    state,
    async (updateState) => {
      if (state.isListboxOpen) {
        await updateStateOnClose({
          force: true,
          state,
          hooks: {
            updateState
          }
        });
      } else if (await input.hooks.checkIfListboxCanOpen({
        reason: "button click"
      })) {
        await updateStateOnOpen({
          state,
          hooks: {
            updateState
          }
        });
        if (state.elementWithFocus != "combobox") {
          await updateState({
            state: {
              elementWithFocus: "combobox"
            }
          });
        }
        if (input.hooks.focusCombobox) {
          await input.hooks.focusCombobox({
            reason: "button click"
          });
        }
      }
    },
    (state2) => input.hooks.updateState({
      state: state2,
      reason: "button click"
    })
  );
  if (state.isListboxOpen) {
    await input.hooks.prepareOptions?.({
      reason: "button click"
    });
    if (input.hooks.findOptionToActivate) {
      const optionToActivate = await input.hooks.findOptionToActivate({
        reason: "button click"
      });
      if (state.activeOption != optionToActivate) {
        state = await input.hooks.updateState({
          state: { activeOption: optionToActivate ?? null },
          reason: optionToActivate ? "button click: filter match" : "button click: filter doesnt match"
        });
      }
    }
  }
  return;
}
async function handleRootFocusOut(input) {
  let state = input.state;
  if (!document.hasFocus() || input.rootEl.querySelector(":scope:hover, :hover")) {
    return;
  }
  state = await collectStateUpdates(
    state,
    async (updateState) => {
      await updateStateOnClose({
        force: false,
        state,
        hooks: {
          updateState
        }
      });
      if (input.hooks.commitValue) {
        await input.hooks.commitValue({
          reason: "root focusout"
        });
      }
    },
    (state2) => input.hooks.updateState({
      state: state2,
      reason: "root focusout"
    })
  );
}
async function handleOptionClick(input) {
  let state = input.state;
  state = await collectStateUpdates(
    state,
    async (updateState) => {
      await updateStateOnClose({
        force: true,
        state,
        hooks: {
          updateState
        }
      });
      if (state.elementWithFocus != "combobox") {
        await updateState({
          state: {
            elementWithFocus: "combobox"
          }
        });
      }
      if (input.hooks.focusCombobox) {
        await input.hooks.focusCombobox({
          reason: "option click"
        });
      }
      if (input.hooks.setComboboxValue) {
        await input.hooks.setComboboxValue({
          value: input.option,
          reason: "option click"
        });
      }
      if (input.hooks.commitValue) {
        await input.hooks.commitValue({
          reason: "option click"
        });
      }
    },
    (state2) => input.hooks.updateState({
      state: state2,
      reason: "option click"
    })
  );
}
async function handleBackgroundPointerUp(input) {
  let state = input.state;
  const target = input.event.target;
  if (input.rootEl.contains(target)) {
    return;
  }
  state = await collectStateUpdates(
    state,
    async (updateState) => {
      await updateStateOnRemoveVisualFocus({ state, hooks: { updateState } });
      await updateStateOnClose({ force: true, state, hooks: { updateState } });
    },
    async (state2) => input.hooks.updateState({
      state: state2,
      reason: "background pointerup"
    })
  );
}
async function updateStateOnRemoveVisualFocus(input) {
  let state = input.state;
  state = await input.hooks.updateState({
    state: {
      elementWithFocus: null
    }
  });
  return state;
}
async function updateStateOnClose(input) {
  let state = input.state;
  if (state.isListboxOpen && (input.force || state.elementWithFocus !== "listbox" && state.elementWithFocus !== "combobox")) {
    state = await input.hooks.updateState({
      state: {
        isListboxOpen: false,
        elementWithFocus: null,
        activeOption: null
      }
    });
  }
  return state;
}
async function close(input) {
  let state = input.state;
  state = await collectStateUpdates(
    state,
    async (updateState) => {
      await updateStateOnClose({ state, force: input.force, hooks: { updateState } });
    },
    async (state2) => input.hooks.updateState({ state: state2, reason: "close" })
  );
  return state;
}
async function updateStateOnOpen(input) {
  let state = input.state;
  if (!state.isListboxOpen) {
    state = await input.hooks.updateState({
      state: {
        isListboxOpen: true
      }
    });
  }
  return state;
}
async function open(input) {
  let state = input.state;
  if (!await input.hooks.checkIfListboxCanOpen?.({ reason: "open" })) {
    return state;
  }
  state = await collectStateUpdates(
    state,
    async (updateState) => {
      await updateStateOnOpen({
        state,
        hooks: { updateState }
      });
    },
    async (state2) => input.hooks.updateState({ state: state2, reason: "open" })
  );
  await input.hooks.prepareOptions?.({
    reason: "open"
  });
  if (input.hooks.findOptionToActivate) {
    const optionToActivate = await input.hooks.findOptionToActivate({
      reason: "open"
    });
    if (state.activeOption != optionToActivate) {
      state = await input.hooks.updateState({
        state: { activeOption: optionToActivate ?? null },
        reason: optionToActivate ? "open: filter match" : "open: filter doesnt match"
      });
    }
  }
  return state;
}
function getA11yAttributes(input) {
  const activedescendant = input.state.isListboxOpen && input.activeOptionId ? input.activeOptionId : "";
  return {
    button: {
      ["aria-expanded"]: input.state.isListboxOpen ? "true" : "false"
    },
    combobox: {
      ["aria-expanded"]: input.state.isListboxOpen ? "true" : "false",
      ["aria-activedescendant"]: activedescendant
    },
    activeOption: {
      ["aria-selected"]: "true"
    },
    otherOptions: {
      ["aria-selected"]: "false"
    }
  };
}
function getBehavior(state) {
  return {
    /**
     * When `true` the options in the listbox should be updated accordingly to the user input.
     *
     * When `false` the options in the listbox should be static and not change.
     */
    canFilterOptionsInListbox: state.autocomplete === "list" || state.autocomplete === "both",
    /**
     * When `true` the current active option should be set as combobox value and inline suggestions should be shown on user input.
     *
     * When `false` the user input should be preserved until the user selects an option.
     */
    canShowInlineSuggestions: state.autocomplete === "both" || state.autocomplete === "inline"
  };
}
function setState(state) {
  return state;
}
function setHooks(hooks) {
  return hooks;
}
async function collectStateUpdates(state, collector, updateState) {
  let collectedState = {};
  let doesStateGotUpdated = false;
  await collector(async (input) => {
    collectedState = { ...collectedState, ...input.state };
    doesStateGotUpdated = true;
    return collectedState;
  });
  if (doesStateGotUpdated && updateState) {
    state = await updateState(collectedState);
  }
  return state;
}

export { close, getA11yAttributes, getBehavior, handleBackgroundPointerUp, handleButtonClick, handleComboboxChange, handleComboboxClick, handleComboboxFocus, handleComboboxInput, handleComboboxKeyDown, handleOptionClick, handleRootFocusOut, open, setHooks, setState };
