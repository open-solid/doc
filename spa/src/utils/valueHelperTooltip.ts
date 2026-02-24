import { StateField } from '@codemirror/state';
import { showTooltip, EditorView, type Tooltip } from '@codemirror/view';
import { completionStatus } from '@codemirror/autocomplete';
import type { MutableRefObject } from 'react';
import type { SchemaObject, OpenApiSpec } from '../openapi';
import { getFormatAtCursor, type FormatValueInfo } from './jsonSchemaCompletion';
import { uuidv7 } from './uuidv7';

/**
 * Creates a CM extension that shows a floating helper panel above string values
 * whose schema format is uuid, date, or date-time.
 */
export function valueHelperTooltipExtension(
  schemaRef: MutableRefObject<SchemaObject | null | undefined>,
  specRef: MutableRefObject<OpenApiSpec | null | undefined>,
) {
  const tooltipField = StateField.define<Tooltip | null>({
    create: () => null,

    update(value, tr) {
      const state = tr.state;

      // Hide when autocomplete dropdown is open
      if (completionStatus(state) !== null) return null;

      const info = getFormatAtCursor(state, state.selection.main.head, schemaRef.current, specRef.current);
      if (!info) return null;

      // Reuse existing tooltip if position/format unchanged
      if (
        value &&
        value.pos === info.from - 1 &&
        (value as Tooltip & { _format?: string })._format === info.format
      ) {
        return value;
      }

      const tooltip: Tooltip & { _format?: string } = {
        pos: info.from - 1, // Position at the opening quote
        above: true,
        strictSide: true,
        arrow: false,
        create: (view) => createTooltipDom(view, info.format, schemaRef, specRef),
        _format: info.format,
      };

      return tooltip;
    },

    provide: (f) => showTooltip.from(f),
  });

  return tooltipField;
}

function replaceValue(
  view: EditorView,
  schemaRef: MutableRefObject<SchemaObject | null | undefined>,
  specRef: MutableRefObject<OpenApiSpec | null | undefined>,
  value: string,
) {
  // Recalculate position from current state (user may have typed since tooltip appeared)
  const info = getFormatAtCursor(view.state, view.state.selection.main.head, schemaRef.current, specRef.current);
  if (!info) return;

  view.dispatch({
    changes: { from: info.from, to: info.to, insert: value },
    selection: { anchor: info.from + value.length },
  });
  view.focus();
}

function createTooltipDom(
  view: EditorView,
  format: FormatValueInfo['format'],
  schemaRef: MutableRefObject<SchemaObject | null | undefined>,
  specRef: MutableRefObject<OpenApiSpec | null | undefined>,
): { dom: HTMLElement } {
  const container = document.createElement('div');
  container.className = 'cm-value-helper';

  const label = document.createElement('span');
  label.className = 'cm-value-helper-label';
  container.appendChild(label);

  switch (format) {
    case 'uuid': {
      label.textContent = 'UUID';
      const btn = document.createElement('button');
      btn.className = 'cm-value-helper-btn';
      btn.textContent = 'Generate';
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        replaceValue(view, schemaRef, specRef, uuidv7());
      });
      container.appendChild(btn);
      break;
    }

    case 'date': {
      label.textContent = 'Date';

      const input = document.createElement('input');
      input.type = 'date';
      input.className = 'cm-value-helper-input';
      input.addEventListener('change', () => {
        if (input.value) {
          replaceValue(view, schemaRef, specRef, input.value);
        }
      });
      container.appendChild(input);

      const btn = document.createElement('button');
      btn.className = 'cm-value-helper-btn';
      btn.textContent = 'Today';
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        replaceValue(view, schemaRef, specRef, new Date().toISOString().slice(0, 10));
      });
      container.appendChild(btn);
      break;
    }

    case 'date-time': {
      label.textContent = 'Date-Time';

      const input = document.createElement('input');
      input.type = 'datetime-local';
      input.step = '1';
      input.className = 'cm-value-helper-input';
      input.addEventListener('change', () => {
        if (input.value) {
          // Convert local datetime-local value to ISO UTC string
          const iso = new Date(input.value).toISOString().replace(/\.\d{3}Z$/, 'Z');
          replaceValue(view, schemaRef, specRef, iso);
        }
      });
      container.appendChild(input);

      const btn = document.createElement('button');
      btn.className = 'cm-value-helper-btn';
      btn.textContent = 'Now';
      btn.addEventListener('mousedown', (e) => {
        e.preventDefault();
        replaceValue(view, schemaRef, specRef, new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'));
      });
      container.appendChild(btn);
      break;
    }
  }

  return { dom: container };
}
