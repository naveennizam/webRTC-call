import React, { useEffect, useState, useRef } from 'react'
import io from 'socket.io-client';

const socket = io('/webRTCPeers', { path: '/webrtc' })

const MeetingScreen = () => {
  const myVideo = useRef()
  const userVideo = useRef()
  const connectionRef = useRef(new RTCPeerConnection(null));

  const textRef = useRef();
  const [offerVisible, setOfferVisible] = useState(true);
  const [answevisible, setAnswerVisible] = useState(false);
  const [status, setstatus] = useState("Make a call now");

  useEffect(() => {

    socket.on('connection-success', success => {
      console.log(success);
    })
    socket.on('sdp', data => {
      console.log(data.stream);
      connectionRef.current.setRemoteDescription(new RTCSessionDescription(data.stream))
      textRef.current.value = JSON.stringify(data.stream);
      if (data.stream.type == "offer") {
        setOfferVisible(false);
        setAnswerVisible(true);
        setstatus("Incoming Call ....")
      }
      else {
        setstatus('Call established ')
      }
    })
    socket.on('candidate', candidate => {
      console.log(candidate);

      connectionRef.current.addIceCandidate(new RTCIceCandidate(candidate))
    })



    const constraints = {
      Audio: true,
      video: true
    }
    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        myVideo.current.srcObject = stream;
        stream.getTracks().forEach(track => {
          _pc.addTrack(track, stream)
        })
        console.log('Got MediaStream:', stream.id);
      })
      .catch(error => {
        console.error('Error accessing media devices.', error);
      });

    const _pc = new RTCPeerConnection(null);
    _pc.onicecandidate = (e) => {
      if (e.candidate) {
        console.log(JSON.stringify(e.candidate));
        sendToPeer('candidate', e.candidate);
      }

    }
    _pc.oniceconnectionstatechange = (e) => {
      console.log(e, "iceconnection");
    }
    _pc.ontrack = (e) => {
      console.log(e);
      userVideo.current.srcObject = e.streams[0]

    }
    connectionRef.current = _pc;

  }, [])

  const sendToPeer = (eventType, playLoad) => {
    socket.emit(eventType, playLoad)

  }

  const processSDP = (stream) => {
    // console.log(JSON.stringify(stream));
    connectionRef.current.setLocalDescription(stream);
    sendToPeer('sdp', { stream })

  }
  const createOffer = () => {
    connectionRef.current.createOffer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    }).then(stream => {
      processSDP(stream);
      setOfferVisible(false);
      setstatus("Calling ....");   

    }).catch(e => console.log(e))
    
  }

  const createAnswer = () => {
    connectionRef.current.createAnswer({
      offerToReceiveAudio: true,
      offerToReceiveVideo: true,
    }).then(stream => {
      processSDP(stream);
      setAnswerVisible(false)
      setstatus("Call established")

    }).catch(e => console.log(e))
  }


  const showHideButton = () => {
    if (offerVisible) {
      return (
        <div>
          <button onClick={createOffer} style={{ margin: "40px 0 0 0px ", padding: "10px 20px", border: "none" , borderRadius:"5px", background: "blue", color: "white" }}>Call</button>
        </div>
      )

    } else if (answevisible) {
      return (
        <div>
          <button onClick={createAnswer} style={{ margin: "40px 0 0 0px ", padding: "10px 20px", border: "none"  , borderRadius:"5px", background: "green", color: "white" }}>Answer</button>
        </div>
      )
    }
  }


  return (
    <>
        
      <div>
    
      
<h2>
  WEBRTC 
</h2>
<p>
  Restriction is not to use PeerJS library
</p>
        <video ref={myVideo} autoPlay={true} style={{ width: "300px",borderRadius: "5px", margin: "0px 20px" }} />
        <video ref={userVideo} autoPlay={true} style={{ width: "300px",borderRadius: "5px"}} />
        <br />


        {showHideButton()}
        <div style={{ margin: "20px" }}>{status}</div>
        <textarea ref={textRef} style={{ display: "none" }} ></textarea>
        <br />
      </div>

    </>
  )
}
export default MeetingScreen


