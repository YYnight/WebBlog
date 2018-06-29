let tags = []
let tagsWrapper
let tagsWidth = 0,
    tagsHeight = 0,
    d = 0
let activeIndex=-1
const colors=['#0088ff','#00aa77','#ff5511','#8877ff','#448888','#006688']

function resize() {
    if (!tagsWrapper) {
        return
    }
    tagsWidth = tagsWrapper.clientWidth
    tagsHeight = tagsWrapper.clientHeight
    d = Math.min(tagsWidth, tagsHeight)
}

function load() {
    tagsWrapper = document.querySelector('.main .tags')
    resize()
    const arr = Array.prototype.slice.call(document.querySelectorAll('.main .content .tags .tag'), 0)
    const len = arr.length
    tags = arr.map((tag, i) => {
        tag.addEventListener('mouseover',()=>{
            activeIndex=i
        })
        tag.addEventListener('mouseout',()=>{
            activeIndex=-1
        })
        return {
            view: tag,
            opacity: Math.random(),
            color:colors[Math.round(Math.random()*(colors.length-1))],
            ng: i/len*2*Math.PI,
            ng1:Math.random()*2*Math.PI,
            x: d/3 * Math.cos(i/len*2*Math.PI),
            y: d/3 * Math.sin(i/len*2*Math.PI)
        }
    })
    renderTags()
}
window.addEventListener('load', load)
window.addEventListener('resize', resize)

function renderTags() {
    tags.filter((t,i)=>i!==activeIndex).forEach(tag => {
        const x=d/3*Math.cos(tag.ng)
        const y=d/3*Math.sin(tag.ng)
        const z=d/3*Math.sin(tag.ng1)
        tag.view.style.color=tag.color
        tag.view.style.textShadow=`2px 2px 20px ${tag.color}`
        tag.view.style.transform = `translate3d(${x}px,${y}px,${z}px)`
        tag.opacity = tag.opacity > 1 ? 0 :
            tag.opacity < 0 ? 1 :
            tag.opacity + 0.01
        tag.ng+=0.007
        tag.ng1+=0.007
    })
    requestAnimationFrame(renderTags)
}