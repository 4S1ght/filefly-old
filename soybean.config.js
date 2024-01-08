
import { Soybean, handlers as h } from 'Soybean'

export default Soybean({
    routines: {
        launch: [
            h.forEach(['client', 'server'], h.group([
                h.fs.mkdir('./.build/{{value}}')
            ]))
        ],
        watch: [
            {
                file: './.build/server/',
                handle: h.cp.restart('serve'),
                options: { recursive: true }
            }
        ]
    },
    cp: {
        serve: {
            command: ['node', '--enable-source-maps', './.build/server/index.js']
        },
        vite: {
            command: ['npm', 'run', 'dev'],
            cwd: './source/client/',
        },
        ts: {
            command: ['tsc', '-w'],
            cwd: './source/server/'
        }
    },
    terminal: {
        keepHistory: 150,
        handlers: {},
        passthroughShell: {
            darwin: '/bin/zsh/',
            win32: 'cmd'
        }[process.platform],
    }
})