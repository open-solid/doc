import { Prism } from 'prism-react-renderer';

// Expose Prism globally so prismjs component files can register grammars.
(typeof globalThis !== 'undefined' ? globalThis : window).Prism = Prism;
