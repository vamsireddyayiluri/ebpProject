import { createStore } from "vuex";

const state = {
  count: [],
};

const mutations = {
  set_count(state, data) {
    state.count = data;
  }
};

const getters = {
  get_count(state) {
    return state.count
  },
};

const actions = {
  update_count: async ({ commit }, payload) => {
    try {
      commit('set_count', payload);
    } catch (error) {
      commit('set_count', 0);
    }
  },
};

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters,
};
