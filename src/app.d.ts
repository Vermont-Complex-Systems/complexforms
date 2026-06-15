// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}

// prevent typescript error when importing csv with plugin-dsv
declare module '*.csv' {
  const data: any[]; 
  export default data;
}}

export {};
