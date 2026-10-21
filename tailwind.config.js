/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
	presets: [require("nativewind/preset")],
	theme: {
		extend: {
			colors: require("./constants/palette"),
			fontFamily: {
				serif: ["Lora_400Regular"],
				sans: ["Inter_400Regular"],
			},
		},
	},
	plugins: [],
};
