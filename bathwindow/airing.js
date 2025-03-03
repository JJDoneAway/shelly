// path for http call
let urlOpen = "api/open"
let urlClose = "api/close"
let motorTime = 53 * 1000 //in ms
let waitTime = 30 * 60 * 1000 //in ms

let shellyClose = {
   id: 0, // ID of Relais, to close window
   on: false,
}

let shellyOpen = {
   id: 1, // ID of Relais, to open window
   on: true, // Standardstatus, um das Relais einzuschalten
}

// to avoid concurrent calls
let runningOpen = false
// will open the window 
function open() {
   if (runningOpen) {
      return
   }
   runningOpen = true

   stopClosing()

   shellyOpen.on = true
   Shelly.call("Switch.Set", shellyOpen)
   //After some seconds we stop the motor again
   Timer.set(motorTime, false, function () {
      shellyOpen.on = false
      Shelly.call("Switch.Set", shellyOpen)
      scheduleClosing()
      runningOpen = false
   })

}

// to avoid concurrent calls
let runningClose = false
// will close the window
function close() {
   if (runningClose) {
      return
   }
   runningClose = true

   stopOpening()

   shellyClose.on = true
   Shelly.call("Switch.Set", shellyClose)
   //After some seconds we stop the motor again
   Timer.set(motorTime, false, function () {
      shellyClose.on = false
      Shelly.call("Switch.Set", shellyClose)
      runningClose = false
   })

}

// to prevent a motor damage we must avoid that opening and closing is enabled
function stopClosing() {
   shellyClose.on = false
   Shelly.call("Switch.Set", shellyClose)
   runningClose = false
}

function stopOpening() {
   shellyOpen.on = false
   Shelly.call("Switch.Set", shellyOpen)
   runningOpen = false
}

// if the windo is open it must be closed after some time again
function scheduleClosing() {
   Timer.set(waitTime, false, function () {
      close()
   })
}

// Der Endpunkt will be available under http://192.168.178.184/script/2/api/open
HTTPServer.registerEndpoint(urlOpen, function (request, response) {
   response.code = 200
   response.body = "Opening Window"
   open()
   response.send() // Senden der Antwort an den Client
})

// Der Endpunkt will be available under http://192.168.178.184/script/2/api/close
HTTPServer.registerEndpoint(urlClose, function (request, response) {
   response.code = 200
   response.body = "Closing Window"
   close()
   response.send() // Senden der Antwort an den Client
})

// manage pressed buttons
Shelly.addEventHandler(
   function (event) {
      // open button is released
      if (event.component == "input:1" && event.info.state == false) {
         open()
      }
      // open button is pressed, we must stop potential closings to avoid motor demages
      if (event.component == "input:1" && event.info.state == true) {
         stopClosing()
      }
      // close button is released
      if (event.component == "input:0" && event.info.state == false) {
         close()
      }
      // close button is pressed, we must stop potential closings to avoid motor demages
      if (event.component == "input:0" && event.info.state == true) {
         stopOpening()
      }
   }
)
