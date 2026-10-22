import Svg, {Path, type SvgProps} from "react-native-svg";

// Source: Figma "arrow-left" (Conversation header), 22×22.
export function ArrowLeftIcon({
	width = 22,
	height = 22,
	color = "#690119",
	...props
}: SvgProps) {
	return (
		<Svg
			width={width}
			height={height}
			viewBox="0 0 22 22"
			fill="none"
			{...props}>
			<Path
				d="M11 4.5826L4.5826 11L11 17.4174M4.5826 11H17.4174"
				stroke={color}
				strokeWidth={1.8}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
		</Svg>
	);
}
