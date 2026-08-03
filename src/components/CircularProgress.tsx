import { TouchableOpacity } from 'react-native'
import Svg, { Path, Circle } from 'react-native-svg'

interface propTypes {
    size?: number
    strokeWidth?: number
    startingDate?: number
    data?: [number, string, string][] // date, exam, color
    maxDate?: number
}

export default function CircularProgress({ size = 120, strokeWidth = 8, startingDate = 0, data, maxDate = 0}: propTypes) {
    
    const today = Math.floor(Date.now() / 86400000)
    const range = maxDate - startingDate
    const progress = range > 0 ? Math.min(1, Math.max(0, (today - startingDate) / range)) : 0

    const radius = (size - strokeWidth) / 2
    const arcLength = Math.PI * radius

    const d = `M ${strokeWidth / 2} ${size / 2} A ${radius} ${radius} 0 0 1 ${size - strokeWidth / 2} ${size / 2}`

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

            {maxDate &&
                data?.map((item, index) => {

                    const now = new Date()
                    const today = Math.floor(now.getTime() / 86400000)

                    const diff = maxDate - today
                    const examDate = item[0] - today

                    const ratio = examDate / diff
                    
                    const theta = ratio * Math.PI


                    const examName = item[1]
                    const examColor = item[2]


                    const knobX = size / 2 + radius * Math.cos(theta)
                    const knobY = size / 2 - radius * Math.sin(theta)
                    return (
                        <TouchableOpacity>
                            <Circle
                                key={index}
                                cx={knobX}
                                cy={knobY}
                                r={knobRadius + 1}
                                fill={examColor ?? "#ffffff"}
                                opacity={1}
                            />
                        </TouchableOpacity>
                        
                    )

                })
            }


        </Svg>
    )
}