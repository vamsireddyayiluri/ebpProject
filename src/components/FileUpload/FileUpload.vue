<script setup>
import { getColor } from '~/helpers/colors'
import { useTruckerManagementStore } from '~/stores/truckerManagement.store'
import { storeToRefs } from 'pinia'

const truckerManagement = useTruckerManagementStore()
const fileLoading = ref(false)
const file = ref(null)
const { onboardingDocuments: files } = storeToRefs(truckerManagement)
const count = ref(0)
const renameFileDialog = ref(null)
const fileName = ref(null)
const fileInput = ref(null)

const handleDragOver = event => {}
const handleDrop = event => {
  file.value = event.dataTransfer.files[0]
  fileLoading.value = true
  showProgress()
  fileName.value = getFilenameAndExtension(file.value.name)[0]
}
const onChangeFile = event => {
  if (event.target.files[0]) {
    file.value = event.target.files[0]
    fileLoading.value = true
    showProgress()
    fileName.value = getFilenameAndExtension(file.value.name)[0]
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

const showProgress = () => {
  const counting = setInterval(function () {
    if (count.value < 100) {
      count.value = count.value + 5
    } else {
      clearInterval(counting)
    }
  }, 50)
  setTimeout(() => {
    fileLoading.value = false
    count.value = 0
    renameFileDialog.value.show(true)
  }, 1500)
}
const removeFile = file => {
  truckerManagement.removeDoc(file.filename || file.name)
  if (fileInput.value) {
    fileInput.value.value = ''
  }
}
const getFilenameAndExtension = fullName => {
  const fileName = fullName.substring(0, fullName.lastIndexOf('.'))
  const ext = fullName.split('.').pop()

  return [fileName, ext]
}
const validate = computed(() => {
  return fileName.value.length < 1
})
const renameFile = () => {
  const newFile = new File([file.value], fileName.value, { type: file.value.type })
  truckerManagement.addDoc(newFile)
  renameFileDialog.value.show(false)
}
</script>

<template>
  <input
    id="fileUpload"
    ref="fileInput"
    type="file"
    accept="application/pdf, .docx, .doc .csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/plain"
    name="userDoc"
    class="input"
    @change="onChangeFile"
  />
  <label
    for="fileUpload"
    @dragover.prevent="handleDragOver"
    @drop.prevent="handleDrop"
  >
    <div
      class="w-full h-56 mb-5 py-10 border-dashed border-md rounded flex justify-center items-center cursor-pointer"
      :style="{ border: getColor('uiLine'), background: getColor('uiSecondary-02') }"
    >
      <template v-if="fileLoading">
        <div class="text-center mt-2">
          <ProgressCircular
            :size="110"
            :value="count"
          >
            <Typography type="text-h4"> {{ count }}% </Typography>
          </ProgressCircular>
          <div class="flex items-center">
            <Typography type="text-body-m-semibold w-40 text-truncate">
              {{ file.name }}
            </Typography>
          </div>
        </div>
      </template>
      <div
        v-else
        class="text-center"
      >
        <Icon
          size="60"
          icon="mdi-file-upload"
          :color="getColor('iconButton-2')"
        />
        <Typography type="text-h4 mt-6">
          Select file to upload (docx, pdf, excel, or others )
        </Typography>
        <Typography
          type="mt-2"
          :color="getColor('textSecondary')"
        >
          or drag and drop it here
        </Typography>
      </div>
    </div>
  </label>

  <div class="flex flex-wrap gap-2">
    <template
      v-for="i in files"
      :key="i.filename"
    >
      <Chip
        prepend-icon="mdi-file"
        closable
        class="pa-1"
        @click:close="removeFile(i)"
      >
        <span class="text-truncate px-2">
          {{ i.filename || i.name }}
        </span>
        <Tooltip>
          {{ i.filename || i.name }}
        </Tooltip>
      </Chip>
    </template>
  </div>
  <Dialog
    ref="renameFileDialog"
    max-width="480"
  >
    <template #text>
      <Typography type="text-h3"> Rename file </Typography>
      <form @submit.prevent="renameFile">
        <div class="flex gap-6 mt-10">
          <Textfield
            v-model.trim="fileName"
            label="File name"
            required
          />
          <Textfield
            v-model="getFilenameAndExtension(file.name)[1]"
            label="Extension"
            readonly
            class="basis-0 pointer-events-none"
          />
        </div>
        <Button
          class="w-full mt-10"
          type="submit"
          :disabled="validate"
        >
          rename
        </Button>
      </form>
    </template>
  </Dialog>
</template>

<style scoped>
.input {
  opacity: 0;
  position: absolute;
  z-index: -1;
}
</style>
