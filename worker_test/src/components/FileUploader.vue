<template>
  <div>
    <input type="file" @change="handleFileChange" />
    <button @click="uploadFile" :disabled="!selectedFile">Upload</button>
    <button @click="downloadFile">Download</button>
    <p>{{ message }}</p>
    <p>Test</p>
    <p v-if="timeInterval">Time taken to upload:{{ timeInterval }} seconds</p>
  </div>
</template>

<script setup>
import { ref, onMounted } from "vue";

const selectedFile = ref(null);
const message = ref("");
const startTime = ref();
const endTime = ref();
const timeInterval = ref(0);

const downloadFile = async () => {
  try {
    const registration = await navigator.serviceWorker.ready;
    const bgFetch = await registration.backgroundFetch.fetch(
      `movie-1`,
      ["https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg"],
      {
        icons: [
          {
            src: "https://cdn.pixabay.com/photo/2015/04/23/22/00/tree-736885_1280.jpg",
            sizes: "192x192",
            type: "image/png",
          },
        ],
        title: `Downloading`,
        downloadTotal: 1024 * 1024 * 1000,
        headers: {
          "X-Operation-Type": "download", // Custom header to indicate download
        },
      }
    );
    // Update the UI.

    bgFetch.addEventListener("progress", () => {
      const downloaded = bgFetch.downloaded;
      const downloadTotal = bgFetch.downloadTotal;
      const progress = (downloaded / downloadTotal) * 100;
      console.log(`Download progress: ${progress.toFixed(2)}%`);
      // Update the UI with the progress
    });
  } catch (error) {
    console.error("Background fetch failed:", error);
  }
};
const handleFileChange = (event) => {
  selectedFile.value = event.target.files[0];
};

const uploadFile = async () => {
  if (!selectedFile.value) {
    message.value = "No file selected";
    return;
  }

  const formData = new FormData();
  formData.append("file", selectedFile.value);
  var url1 =
    "https://fuiui5bpm5.execute-api.ap-northeast-1.amazonaws.com/multiuser/fileupload";
  var url = `https://serviceworker.knowledgev.dev.direct4b.app/upload`;
  // try {
  //   const response = await fetch(url, {
  //     method: "POST",
  //     body: formData,
  //   });
  //   console.log("Response", response);
  // } catch (Error) {
  //   console.log("Response", Error);
  // }

  try {
    let intervalId = null;
    let counter = 0;
    const request = new Request(url, {
      method: "POST",
      body: formData,
    });
    const reg = await navigator.serviceWorker.ready;
    console.log("Reg", reg);
    startTime.value = Date.now();
    console.log("Start time", startTime.value);
    const bgFetchReg = await reg.backgroundFetch.fetch("my-upload", request, {
      uploadTotal: formData.size,
      downloadTotal: 0,
      title: "Uploading file",
      icons: [{ src: "./movie.png", sizes: "192x192", type: "image/png" }],
    });
    intervalId = setInterval(() => {
      counter++;
      timeInterval.value = counter;
    }, 1000);

    bgFetchReg.addEventListener("progress", () => {
      console.log("Upload progressing ");
      const uploaded = bgFetchReg.uploaded;
      const uploadedMB = uploaded / (1024 * 1024);
      console.log(`Uploaded size: ${uploadedMB.toFixed(2)} MB`);

      const uploadTotal = bgFetchReg.uploadTotal;
      const uploadTotalMB = uploadTotal / (1024 * 1024);
      console.log(`Total size to upload: ${uploadTotalMB.toFixed(2)} MB`);

      const progress = (uploaded / uploadTotal) * 100;

      console.log(`Upload progress: ${progress.toFixed(2)}%`);
      if (progress.toFixed(2) >= 100) {
        clearInterval(intervalId);
        intervalId = null;
      }
    });

    bgFetchReg.addEventListener("backgroundfetchfail", (event) => {
      // Log detailed error information
      console.error("Background fetch failed:", event.registration);
      console.error("Failure reason:", event.registration.failureReason);
    });

    bgFetchReg.addEventListener("backgroundfetchabort", () => {
      console.error(`Upload aborted `);
    });
  } catch (error) {
    console.error("Error uploading file:", error);
  }
};

onMounted(() => {
  if (navigator.serviceWorker) {
    navigator.serviceWorker.addEventListener("message", (event) => {
      console.log("Message received from service worker");
      if (event.data.message === "Background fetch succeeded") {
        // Fetch the cached file and display it
        message.value = "File Operation Completed";
        endTime.value = Date.now(); // Record end time
        const timeTaken = (endTime.value - startTime.value) / 1000; // Calculate time taken in seconds
        console.log(`Upload Time Taken ${timeTaken} seconds`);
      }
    });
  }
});
</script>
