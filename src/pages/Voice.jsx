import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/router';
import { verifyAuth } from '@/middlewares/User';

export default function VoiceChat({ session }) {
    const [animation, setAnimation] = useState('pulse')
    const [lang, setLang] = useState('en-US')
    const router = useRouter();
    const { id } = router.query;
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [speechSupported, setSpeechSupported] = useState(false);
    const recognitionRef = useRef(null);
    const speakBtn = useRef(null)

    useEffect(() => {
        if (!session && (!admin || admin != 'slmhh')) {
            window.location.href = "/Login"
        }
    }, [session])

    const [controle, setControle] = useState(true)

    useEffect(() => {
        if (controle) {
            getGeminiResponse('Hello')
            setControle(false)
        }
    }, [id])

    useEffect(() => {
        if (recognitionRef.current) {
            recognitionRef.current.lang = lang;
        }
    }, [lang]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            if (SpeechRecognition) {
                recognitionRef.current = new SpeechRecognition();
                setSpeechSupported(true);

                const recognition = recognitionRef.current;
                recognition.continuous = false;
                recognition.interimResults = false;
                recognition.lang = lang;
                recognition.maxAlternatives = 1;

                recognition.onstart = () => {
                    console.log('Recognition started');
                    setIsListening(true);
                };

                recognition.onresult = (event) => {
                    console.log('Recognition result:', event);
                    const transcript = event.results[0][0].transcript;
                    console.log('Transcript:', transcript);
                    setNewMessage(transcript);
                    handleSendMessage('user', id, transcript);
                    setIsListening(false);
                };

                recognition.onerror = (event) => {
                    console.error('Recognition error:', event.error);
                    setIsListening(false);

                    // Gestion des erreurs spécifiques - ne pas afficher d'alerte pour l'écoute automatique
                    if (!window.automaticListening) {
                        switch (event.error) {
                            case 'no-speech':
                                alert('Aucune parole détectée. Veuillez réessayer.');
                                break;
                            case 'audio-capture':
                                alert('Impossible d\'accéder au microphone. Vérifiez les permissions.');
                                break;
                            case 'not-allowed':
                                alert('Permission microphone refusée. Veuillez autoriser l\'accès au microphone.');
                                break;
                            default:
                                alert(`Erreur de reconnaissance vocale: ${event.error}`);
                        }
                    }

                    // Réinitialiser le flag d'écoute automatique
                    window.automaticListening = false;
                };

                recognition.onend = () => {
                    console.log('Recognition ended');
                    setIsListening(false);
                };

                recognition.onnomatch = () => {
                    console.log('No match found');
                    setIsListening(false);
                    alert('Aucune correspondance trouvée. Veuillez parler plus clairement.');
                };
            } else {
                console.error('Speech recognition not supported');
                setSpeechSupported(false);
            }
        }

        // Cleanup
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
        };
    }, []);

    useEffect(() => {
        if (id) {
            const fetchMessages = async () => {
                try {
                    const response = await fetch(`/api/msgs/get?id=${id}`);
                    if (response.ok) {
                        const data = await response.json();
                        setMessages(data.msgs || []);
                    } else {
                        console.error('Failed to fetch messages');
                    }
                } catch (error) {
                    console.error('Error fetching messages:', error);
                }
            };

            fetchMessages();
        } else {
            window.location.href = `/Chat?id=${session._id}`;
        }
    }, [id, session]);

    const handleSendMessage = async (sender, userID, content) => {
        if (!content.trim()) return;

        try {
            const response = await fetch('/api/msgs/add', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    sender, userID, content
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setMessages(prevMessages => [...prevMessages, data.newMessage]);

                // Seulement appeler Gemini si c'est un message utilisateur
                if (sender === 'user') {
                    getGeminiResponse(content);
                }
            } else {
                console.error('Failed to send message');
            }
        } catch (error) {
            console.error('Error sending message:', error);
        }
    };

    const handleLogout = async () => {
        try {
            const response = await fetch('/api/_auth/logout', {
                method: 'POST',
            });

            if (response.ok) {
                window.location.href = '/Login';
            } else {
                console.error('Failed to logout');
            }
        } catch (error) {
            console.error('Error during logout:', error);
        }
    };

    const getGeminiResponse = async (msg) => {
        try {
            const res = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=AIzaSyDwVqL80ycP0sMykaPmeq_u7OdCJw35Otc`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [
                            {
                                role: 'user',
                                parts: [{ text: msg }],
                            },
                        ],
                    }),
                }
            );

            const gemini = await res.json();
            const rawText = gemini?.candidates?.[0]?.content?.parts?.[0]?.text;

            if (rawText) {
                await fetch('/api/msgs/add', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        sender: 'gemini', userID: id, content: rawText
                    }),
                });

                const geminiResponse = {
                    sender: 'gemini',
                    content: rawText,
                    created_At: new Date().toISOString(),
                };

                setMessages(prevMessages => [...prevMessages, geminiResponse]);
                setNewMessage('');

                // Synthèse vocale de la réponse
                if (typeof window !== 'undefined' && window.speechSynthesis) {
                    const utterance = new SpeechSynthesisUtterance(rawText);

                    // Démarrer l'animation bounce quand le robot commence à parler
                    setAnimation('bounce');

                    // Attendre que les voix soient chargées
                    const setVoiceAndSpeak = () => {
                        const voices = window.speechSynthesis.getVoices();

                        // Filtrer pour trouver une voix féminine uniquement
                        const femaleVoice = voices.find(voice => {
                            const voiceName = voice.name.toLowerCase();
                            const voiceLang = voice.lang.toLowerCase();

                            // Chercher des voix explicitement féminines
                            return (
                                (voiceLang.includes('fr') && (
                                    voiceName.includes('female') ||
                                    voiceName.includes('amélie') ||
                                    voiceName.includes('audrey') ||
                                    voiceName.includes('marie') ||
                                    voiceName.includes('celine') ||
                                    voiceName.includes('virginie') ||
                                    voiceName.includes('woman') ||
                                    voiceName.includes('femme')
                                )) ||
                                (voiceLang.includes('en') && (
                                    voiceName.includes('female') ||
                                    voiceName.includes('woman') ||
                                    voiceName.includes('samantha') ||
                                    voiceName.includes('karen') ||
                                    voiceName.includes('serena') ||
                                    voiceName.includes('zira') ||
                                    voiceName.includes('susan')
                                )) ||
                                (voiceLang.includes('ar') && (
                                    voiceName.includes('female') ||
                                    voiceName.includes('woman') ||
                                    voiceName.includes('مؤنث')
                                ))
                            );
                        });

                        // Si aucune voix féminine n'est trouvée, prendre la première voix disponible
                        // mais loguer un avertissement
                        if (!femaleVoice) {
                            console.warn('Aucune voix féminine trouvée, utilisation de la voix par défaut');
                        }

                        utterance.voice = femaleVoice || voices[0];
                        utterance.rate = 0.9;
                        utterance.pitch = 1.2; // Augmenter le pitch pour une voix plus féminine

                        // Événements pour gérer l'animation
                        utterance.onstart = () => {
                            console.log('Synthèse vocale démarrée');
                            setAnimation('bounce');
                        };

                        utterance.onend = () => {
                            console.log('Synthèse vocale terminée');
                            setAnimation('pulse'); // Retour à l'animation pulse quand fini
                            speakBtn.current.click()
                        };

                        utterance.onerror = (event) => {
                            console.error('Erreur synthèse vocale:', event);
                            setAnimation('pulse'); // Retour à pulse en cas d'erreur
                        };

                        window.speechSynthesis.speak(utterance);
                    };

                    // Si les voix ne sont pas encore chargées, attendre qu'elles le soient
                    if (window.speechSynthesis.getVoices().length === 0) {
                        window.speechSynthesis.addEventListener('voiceschanged', setVoiceAndSpeak, { once: true });
                    } else {
                        setVoiceAndSpeak();
                    }
                }
            }
        } catch (err) {
            console.error('Error with Gemini response:', err);
            alert('Erreur lors de la génération de la réponse.');
        }
    };

    const toggleListening = async () => {
        if (!speechSupported) {
            alert('La reconnaissance vocale n\'est pas supportée par votre navigateur.');
            return;
        }

        if (isListening) {
            // Arrêter l'écoute
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            setIsListening(false);
        } else {
            // Commencer l'écoute
            try {
                // Vérifier les permissions microphone
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                stream.getTracks().forEach(track => track.stop()); // Fermer le stream de test

                if (recognitionRef.current) {
                    recognitionRef.current.start();
                }
            } catch (error) {
                console.error('Microphone access denied:', error);
                alert('Permission microphone refusée. Veuillez autoriser l\'accès au microphone dans les paramètres de votre navigateur.');
            }
        }
    };

    return (
        <div className="min-h-screen bg-black text-white flex flex-col">
            <header className="bg-black/60 backdrop-blur-3xl p-4 flex justify-between items-center fixed w-full z-10">
                <h1 className="text-xl font-bold">Voice Chat</h1>
                <div className="flex items-center gap-4">
                    {!speechSupported && (
                        <span className="text-yellow-400 text-sm">Reconnaissance vocale non supportée</span>
                    )}
                    <button
                        onClick={handleLogout}
                        className="duration-200 bg-gradient-to-l hover:from-pink-900 hover:to-rose-900 text-white px-4 py-2 rounded-xl"
                    >
                        Logout
                    </button>
                </div>
            </header>

            <div className='fixed w-full h-full flex flex-col justify-center items-center'>
                <div className='rounded-full w-64 h-64 bg-gradient-to-l from-pink-600 to-blue-600'>
                    <img src="/robot.png" alt="slm hh AI" className={`animate-${animation}`} />
                </div>
                <select className='focus:outline-none focus:ring-0 border-none px-4 py-2' onChange={(e) => setLang(e.target.value)}>
                    <option value="en-US" className='bg-black'>English</option>
                    <option value="fr-FR" className='bg-black'>Frensh</option>
                    <option value="ar-MA" className='bg-black'>Arabic</option>
                </select>
            </div>

            <div className="p-4 fixed w-full bottom-0 bg-black/60 backdrop-blur-3xl">
                <div className="flex gap-2">
                    <button
                        ref={speakBtn}
                        onClick={toggleListening}
                        disabled={!speechSupported}
                        className={`px-4 py-2 rounded-r-3xl transition-all duration-200 text-white ${isListening
                            ? 'bg-rose-600 animate-pulse'
                            : speechSupported
                                ? 'bg-gray-700 hover:bg-rose-600'
                                : 'bg-gray-500 cursor-not-allowed'
                            }`}
                    >
                        {isListening ? '🎤 listening...' : '🎤 Speak'}
                    </button>
                </div>

                {isListening && (
                    <div className="mt-2 text-center text-sm text-gray-400">
                        Parlez maintenant... Cliquez à nouveau pour arrêter
                    </div>
                )}
            </div>
        </div>
    );
}

export async function getServerSideProps({ req, res }) {
    const user = verifyAuth(req, res);

    if (user) {
        return {
            props: {
                session: {
                    _id: user._id,
                    name: user.name,
                    email: user.email,
                },
            },
        };
    }

    return { props: { session: null } };
}