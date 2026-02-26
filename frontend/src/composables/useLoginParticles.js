import { ref, onMounted, onUnmounted } from 'vue'

export function useLoginParticles() {
    const particleCanvas = ref(null)
    let animationId = null
    let cleanup = null

    const initParticles = () => {
        const canvas = particleCanvas.value
        if (!canvas) return

        const ctx = canvas.getContext('2d')
        const particles = []
        const PARTICLE_COUNT = 60
        const CONNECTION_DISTANCE = 100

        const resize = () => {
            canvas.width = canvas.offsetWidth * window.devicePixelRatio
            canvas.height = canvas.offsetHeight * window.devicePixelRatio
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
        }

        resize()
        window.addEventListener('resize', resize)

        class Particle {
            constructor() { this.reset() }
            reset() {
                this.x = Math.random() * canvas.offsetWidth
                this.y = Math.random() * canvas.offsetHeight
                this.vx = (Math.random() - 0.5) * 0.4
                this.vy = (Math.random() - 0.5) * 0.4
                this.radius = Math.random() * 2 + 1
                this.opacity = Math.random() * 0.4 + 0.2
            }
            update() {
                this.x += this.vx
                this.y += this.vy
                if (this.x < 0 || this.x > canvas.offsetWidth) this.vx *= -1
                if (this.y < 0 || this.y > canvas.offsetHeight) this.vy *= -1
            }
            draw() {
                ctx.beginPath()
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2)
                ctx.fillStyle = `rgba(255, 255, 255, ${this.opacity})`
                ctx.fill()
            }
        }

        for (let i = 0; i < PARTICLE_COUNT; i++) particles.push(new Particle())

        const drawConnections = () => {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x
                    const dy = particles[i].y - particles[j].y
                    const distance = Math.sqrt(dx * dx + dy * dy)
                    if (distance < CONNECTION_DISTANCE) {
                        ctx.beginPath()
                        ctx.moveTo(particles[i].x, particles[i].y)
                        ctx.lineTo(particles[j].x, particles[j].y)
                        ctx.strokeStyle = `rgba(255, 255, 255, ${0.12 * (1 - distance / CONNECTION_DISTANCE)})`
                        ctx.lineWidth = 1
                        ctx.stroke()
                    }
                }
            }
        }

        const animate = () => {
            ctx.clearRect(0, 0, canvas.offsetWidth, canvas.offsetHeight)
            particles.forEach(p => { p.update(); p.draw() })
            drawConnections()
            animationId = requestAnimationFrame(animate)
        }

        animate()

        return () => {
            window.removeEventListener('resize', resize)
        }
    }

    onMounted(() => {
        cleanup = initParticles()
    })

    onUnmounted(() => {
        if (animationId) cancelAnimationFrame(animationId)
        if (cleanup) cleanup()
    })

    return { particleCanvas }
}
