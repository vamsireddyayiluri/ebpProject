import { createStore } from 'vuex';
import counter from './modules/counter';

export default createStore({
    actions: {},
    mutations: {},
    getters:{},
    modules: {
        counter
    },
    plugins: []
})