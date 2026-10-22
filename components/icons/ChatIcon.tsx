import Svg, {Path, type SvgProps} from "react-native-svg";

export function ChatIcon({color = "#855A59", ...props}: SvgProps) {
	return (
		<Svg width={20} height={20} viewBox="0 0 24 24" fill="none" {...props}>
			<Path
				d="M20 11.5a7.5 7.5 0 0 1-7.5 7.5H7l-3 2v-5.1a7.5 7.5 0 1 1 16-4.4Z"
				stroke={color}
				strokeWidth={1.7}
				strokeLinecap="round"
				strokeLinejoin="round"
			/>
			<Path
				d="M8 10h8M8 14h5"
				stroke={color}
				strokeWidth={1.7}
				strokeLinecap="round"
			/>
		</Svg>
	);
}
