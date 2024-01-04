
import { Soybean, handlers as h } from 'Soybean'

export default Soybean({
    cp: {
        vite: {
            command: ['npm', 'run', 'dev'],
            cwd: './client/'
        },
        ts: {
            command: ['tsc', '-w'],
            cwd: './server/'
        }
    },
    routines: {
        launch: [],
        watch: []
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