import React from 'react'

interface Slide {
    id: string
    name: string
    content: any
    duration: number
}

interface CustomSlideRendererProps {
    slide: Slide
}

const CustomSlideRenderer: React.FC<CustomSlideRendererProps> = ({ slide }) => {
    console.log('🎬 CustomSlideRenderer rendering slide:', slide.name, slide)
    console.log('   Content:', slide.content)
    console.log('   Zones:', slide.content?.zones)

    if (!slide.content?.zones) {
        console.error('❌ No zones in slide content!')
        return (
            <div style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '2rem',
                background: '#1f2937'
            }}>
                Nessun contenuto - Slide: {slide.name}
            </div>
        )
    }

    console.log('✅ Rendering zones:', slide.content.zones.length)

    return (
        <div style={{
            width: '100%',
            height: '100%',
            minHeight: '100vh',
            position: 'relative',
            overflow: 'hidden',
            background: 'transparent'
        }}>
            {slide.content.zones.map((zone: any, index: number) => {
                console.log(`   Zone ${index}:`, zone.type, zone.id, 'content:', zone.content?.substring(0, 50))
                console.log(`   Zone ${index} position:`, { x: zone.x, y: zone.y, width: zone.width, height: zone.height })
                console.log(`   Zone ${index} FULL URL:`, zone.content)

                // Calculate position - if undefined, use defaults that make it visible
                const left = zone.x !== undefined ? `${zone.x}%` : '0%'
                const top = zone.y !== undefined ? `${zone.y}%` : '0%'
                const width = zone.width !== undefined ? `${zone.width}%` : '100%'
                const height = zone.height !== undefined ? `${zone.height}%` : '100%'

                console.log(`   Zone ${index} computed style:`, { left, top, width, height })

                return (
                    <div
                        key={zone.id || index}
                        style={{
                            position: 'absolute',
                            left,
                            top,
                            width,
                            height,
                            ...zone.style,
                            overflow: 'hidden'
                        }}
                    >
                    {zone.type === 'image' && zone.content && (
                        <>
                            {console.log('🖼️ Rendering image zone:', zone.content)}
                            <img
                                src={zone.content}
                                alt=""
                                onLoad={(e) => {
                                    console.log('✅ IMAGE LOADED successfully:', zone.content)
                                    console.log('   Image dimensions:', e.currentTarget.naturalWidth, 'x', e.currentTarget.naturalHeight)
                                }}
                                onError={(e) => {
                                    console.error('❌ IMAGE LOAD ERROR:', zone.content)
                                    console.error('   Error details:', e)
                                }}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover',
                                    display: 'block'
                                }}
                            />
                        </>
                    )}
                    {zone.type === 'text' && zone.content && (
                        <div style={{
                            width: '100%',
                            height: '100%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '1rem',
                            whiteSpace: 'pre-wrap',
                            ...zone.style
                        }}>
                            {zone.content}
                        </div>
                    )}
                    {zone.type === 'video' && zone.content && (
                        <video
                            src={zone.content}
                            autoPlay
                            loop
                            muted
                            style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                            }}
                        />
                    )}
                    </div>
                )
            })}
        </div>
    )
}

export default CustomSlideRenderer
