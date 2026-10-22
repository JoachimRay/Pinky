import Svg, {Path, type SvgProps} from "react-native-svg";

// Source: Figma "arrow-up" (Send message), 21×21.
export function ArrowUpIcon({
	width = 21,
	height = 21,
	color = "#F8DAC8",
	...props
}: SvgProps) {
	return (
		<Svg
			width={width}
			height={height}
			viewBox="0 0 21 21"
			fill="none"
			{...props}>
			<Path
				d="M16.6257 10.5L10.5 4.3743L4.3743 10.5M10.5 4.3743V16.6257"
				stroke={color}
				strokeWidth={1.8}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}
