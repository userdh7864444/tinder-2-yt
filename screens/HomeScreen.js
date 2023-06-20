import { View, Text, Button, SafeAreaView, TouchableOpacity, Image, StyleSheet } from 'react-native'
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigation } from '@react-navigation/native';
import useAuth from '../hooks/useAuth';
import tw from "tailwind-rn";
import { AntDesign, Entypo, Ionicons } from '@expo/vector-icons';
import Swiper from 'react-native-deck-swiper';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    onSnapshot,
    query,
    where,
    setDoc,
    serverTimestamp
} from 'firebase/firestore';
import { db } from '../firebase';
import { async } from '@firebase/util';
import generateId from '../lib/generateId';


const DUMMY_DATA = [
    {
        firstName: "Danish",
        lastName: 'Hussain',
        job: "Software Developer",
        photoURL: "https://thumbs.dreamstime.com/b/handsome-man-black-suit-white-shirt-posing-studio-attractive-guy-fashion-hairstyle-confident-man-short-beard-125019349.jpg",
        age: 17,
        id: 1,
    },

    {
        firstName: "Kawish",
        lastName: "Ali",
        job: "Softare Developer",
        photoURL:
            "https://images.unsplash.com/photo-1503443207922-dff7d543fd0e?ixlib=rb-1.2.1&ixid=MnwxMjA3fDB8MHxzZWFyY2h8MXx8bWVufGVufDB8fDB8fA%3D%3D&w=1000&q=80",
        age: 19,
        id: 2,
    },

    {
        firstName: "Daniyal",
        lastName: 'Hussain',
        job: "Software Developer",
        photoURL: "https://thumbs.dreamstime.com/b/handsome-man-black-suit-white-shirt-posing-studio-attractive-guy-fashion-hairstyle-confident-man-short-beard-125019349.jpg",
        age: 17,
        id: 3,
    }
]

const HomeScreen = () => {
    const navigation = useNavigation();
    const { user, logout } = useAuth();
    const [profiles, setProfiles] = useState([]);
    const swipeRef = useRef(null);

    useLayoutEffect(() =>
        onSnapshot(doc(db, "users", user.uid), (snapshot) => {
            console.log(snapshot);
            if (!snapshot.exists()) {
                navigation.navigate('Modal');
            }

        }),
        []
    );


    useEffect(() => {
        let unsub;

        const fetchCards = async () => {
            const passes = await getDocs(
                collection(db, "users", user.uid, "passes")
            ).then((snapshot) => snapshot.docs.map((doc) => doc.id));

            const swipes = await getDocs(
                collection(db, "users", user.uid, "swipes")
            ).then((snapshot) => snapshot.docs.map((doc) => doc.id));

            const passedUserIds = passes.length > 0 ? passes : ["test"];
            const swipedUserIds = passes.length > 0 ? swipes : ["test"];

            console.log([...passedUserIds, ...swipedUserIds])

            unsub = onSnapshot(
                query(collection(db, 'users'), where("id", "not-in", [...passedUserIds, ...swipedUserIds])),
                (snapshot) => {
                    setProfiles(
                        snapshot.docs
                            // .filter((doc)=>doc.id !== user.uid)
                            .map(doc => ({
                                id: doc.id,
                                ...doc.data(),
                            }))
                    );

                });
        };

        fetchCards();
        return unsub;
    }, []);

    const swipeLeft = (cardIndex) => {
        if (!profiles[cardIndex]) return;

        const userSwiped = profiles[cardIndex];
        console.log(`You swiped PASS on ${userSwiped.displayName}`);

        setDoc(doc(db, "users", user.uid, "passes", userSwiped.id),
            userSwiped);
    };

    const swipeRight = async (cardIndex) => {
        if (!profiles[cardIndex]) return;

        const userSwiped = profiles[cardIndex];
        const loggedInProfile = await (
            await getDoc(doc(db, "users", user.uid))
        ).data();

        //Check if the user swiped on you...

        getDoc(doc(db, "users", userSwiped.id, "swipes", user.uid)).then(
            (documentSnapshot) => {
                if (documentSnapshot.exists()) {
                    //user has matched with you before you matched with them...
                    //Create a MATCH!
                    console.log(`Hooray, You MATCHED with ${userSwiped.displayName}`);

                    setDoc(
                        doc(db, "users", user.uid, "swipes", userSwiped.id),
                        userSwiped
                    );

                    //CREATE A MATCH!!!
                    setDoc(doc(db, 'matches', generateId(user.uid, userSwiped.id)), {
                        users: {
                            [user.uid]: loggedInProfile,
                            [userSwiped]: userSwiped
                        },
                        userMatched: [user.uid, userSwiped.id],
                        timestamp: serverTimestamp()
                    });

                    navigation.navigate('Match', {
                        loggedInProfile,
                        userSwiped,
                    });

                } else {
                    // User has swiped as first interaction between the two or didnt get swiped on...
                    console.log(
                        `You swiped on ${userSwiped.displayName}(${userSwiped.job})`
                    );
                    setDoc(
                        doc(db, "users", user.uid, "swipes", userSwiped.id),
                        userSwiped
                    );
                }
            }
        )
    };

    return (
        <SafeAreaView style={{ top: 50, flex: 1 }}>
            {/* Header */}

            <View
                style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 15, }}>
                <TouchableOpacity onPress={logout}>
                    <Image
                        style={{ height: 45, width: 45, borderRadius: 40, }}
                        source={{ uri: user.photoURL }} />
                </TouchableOpacity>

                <TouchableOpacity onPress={() => navigation.navigate("Modal")} >
                    <Image style={{ height: 45, width: 45 }} source={require("../assets/tinderlogo.png")} />
                </TouchableOpacity>


                <TouchableOpacity onPress={() => navigation.navigate("Chat")}>
                    <Ionicons name='chatbubbles-sharp' size={33} color="#FF5864" />
                </TouchableOpacity>
            </View>

            {/* End of Header */}

            {/* Cards */}

            <View style={tw("flex-1 -mt-6")}>
                <Swiper
                    ref={swipeRef}
                    containerStyle={{ backgroundColor: 'transparent' }}
                    cards={profiles}
                    stackSize={5}
                    cardIndex={0}
                    animateCardOpacity
                    verticalSwipe={false}
                    onSwipedLeft={(cardIndex) => {
                        console.log("Swipe PASS")
                        swipeLeft(cardIndex);
                    }}
                    onSwipedRight={(cardIndex) => {
                        console.log("Swipe MATCH")
                        swipeRight(cardIndex);
                    }}
                    overlayLabels={{
                        left: {
                            title: 'NOPE',
                            style: {
                                label: {
                                    textAlign: 'right',
                                    color: 'red',
                                },
                            },
                        },
                        right: {
                            title: 'MATCH',
                            style: {
                                label: {
                                    color: '#4DED30',
                                },
                            },
                        },
                    }}
                    renderCard={(card) => card ? (
                        <View
                            key={card.id}
                            style={tw("bg-white h-3/4 rounded-xl")}
                        >
                            <Image
                                style={tw("absolute top-0 h-full w-full rounded-xl")}
                                source={{ uri: card.photoURL }}
                            />

                            <View
                                style=
                                {[tw("absolute bottom-0 bg-white w-full flex-row justify-between items-center h-20 px-6 py-2 rounded-b"), styles.cardShadow]}>
                                <View>
                                    <Text style={tw("text-xl font-bold")}>
                                        {card.displayName}
                                    </Text>
                                    <Text>
                                        {card.job}
                                    </Text>
                                </View>
                                <Text style={tw("text-2xl font-bold")}>{card.age}</Text>
                            </View>
                        </View>

                    ) : (
                        <View
                            style={[tw(
                                "relative bg-white h-3/4 rounded-xl justify-center items-center"
                            ),
                            styles.cardShadow
                            ]}
                        >
                            <Text style={tw("font-bold pb-5")}>No more profiles</Text>

                            <Image
                                style={{
                                    height: 100,
                                    width: 100
                                }}
                                resizeMode="contain"

                                source={require("../assets/sademoji.png")}
                            />
                        </View>
                    )}
                />
            </View>

            <View style={tw("flex flex-row justify-evenly")}>
                <TouchableOpacity
                    onPress={() => swipeRef.current.swipeLeft()}
                    style={[tw("items-center justify-center rounded-full w-16 h-16 bg-red-200"), { marginBottom: 80 }]}>
                    <Entypo name='cross' size={24} color="red" />
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => swipeRef.current.swipeRight()}
                    style={tw("items-center justify-center rounded-full w-16 h-16 bg-green-200")}>
                    <AntDesign name='heart' size={24} color="green" />
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
};

export default HomeScreen

const styles = StyleSheet.create({
    cardShadow: {
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 1,
        },
        shadowOpacity: 0.2,
        shadowRadius: 1.41,

        elevation: 2,
    },
});