import React, {useEffect, useState} from 'react';
import {Text, View, StyleSheet, ImageBackground} from 'react-native';
import tw from "tailwind-react-native-classnames";
import styles from "./style";
import {Storage} from 'aws-amplify';


const TinderCard = (props) => {
    const {name, image, bio, gender} = props.user;
    const [imageUrl, setImageUrl] = useState(image);

    useEffect(() => {
        if (!image?.startsWith('http')) {
            Storage.get(image).then(setImageUrl);
        }
    }, [image]);

    return (
            <View style={styles.card}>
                <View style={tw`flex-1 items-center justify-center`}>
                    <ImageBackground
                        style={styles.image}
                        source={{uri: imageUrl}} >
                        <View style={tw`p-6`}>
                            <Text style={{fontSize: 30, color: 'white', fontWeight: 'bold',}}>{name}</Text>
                            <Text style={{fontSize: 18, color: 'white', lineHeight: 25,}}>{bio}</Text>
                            <Text style={{fontSize: 18, color: 'white', lineHeight: 25, fontWeight: '600', marginTop: 10,}}>{gender}</Text>
                        </View>
                    </ImageBackground>
                </View>
            </View>
    );
};

export default TinderCard;

