import Svg, { Path, Circle } from 'react-native-svg'

export default function CircularProgress({ size = 120, strokeWidth = 8, progress = 0.7 }) {
    const radius = (size - strokeWidth) / 2
    const arcLength = Math.PI * radius

    const d = `M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`

    const theta = Math.PI * (1 - progress)
    const knobX = size / 2 + radius * Math.cos(theta)
    const knobY = size / 2 - radius * Math.sin(theta)
    const knobRadius = strokeWidth / 2 + 4

    return (
        <Svg style={{
            width: size,
            height: size / 2 + strokeWidth,
        }}>

            <Path
                d={d}
                stroke="#8a65d9"
                strokeWidth={strokeWidth}
                fill="none"
            />
            
            <Path
                d={d}
                stroke="#f6fcff"
                strokeWidth={strokeWidth}
                fill="none"
                strokeLinecap="round"
                strokeDasharray={`${arcLength}`}
                strokeDashoffset={arcLength * (1 - progress)}
            />

  
            <Circle
                cx={knobX}
                cy={knobY}
                r={knobRadius + 1}
                fill="#fafafa"
                opacity={1}
            />

        </Svg>
    )
}