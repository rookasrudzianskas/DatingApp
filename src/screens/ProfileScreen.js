import React, {useEffect, useState} from 'react';
import {Text, View, StyleSheet, SafeAreaView, Image, TouchableOpacity, TextInput, Alert} from 'react-native';
import tw from "tailwind-react-native-classnames";
import users from "../../assets/data/users";
import {Auth} from 'aws-amplify';
import {Picker} from '@react-native-picker/picker';
import {DataStore, Storage} from 'aws-amplify';
import {User} from "../models";
import * as ImagePicker from 'expo-image-picker';
import {S3Image} from 'aws-amplify-react-native'

const ProfileScreen = () => {
    const [user, setUser] = useState(null);
    const [name, setName] = useState('');
    const [bio, setBio] = useState('');
    const [gender, setGender] = useState();
    const [lookingFor, setLookingFor] = useState();
    const [newImageLocalUri, setNewImageLocalUri] = useState(null);

    let openImagePickerAsync = async () => {
        let permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

        if (permissionResult.granted === false) {
            alert("Permission to access camera roll is required!");
            return;
        }

        let pickerResult = await ImagePicker.launchImageLibraryAsync();
        console.log(pickerResult);
        setNewImageLocalUri(pickerResult.uri);
    }


    const signOutFunc = async () => {
    //     sign out
        await DataStore.clear();
        Auth.signOut().then();
    }


    const isValid = () => {
        return name && bio && gender && lookingFor;
    }

    const uploadImage = async () => {
        try {
            const response = await fetch(newImageLocalUri);

            const blob = await response.blob();

            const urlParts = newImageLocalUri.split('.');
            const extension = urlParts[urlParts.length - 1];

            const key = `${user.id}.${extension}`;

            await Storage.put(key, blob);

            return key;
        } catch (e) {
            console.log(e);
        }
        return '';
    };

    useEffect(() => {
        const getCurrentUser = async () => {
            const authuser = await Auth.currentAuthenticatedUser();
            const dbUsers = await DataStore.query(User, u => u.sub('eq', authuser.attributes.sub),);

            if(!dbUsers || dbUsers.length === 0) {
                return;
            }

            const dbUser = dbUsers[0];
            setUser(dbUser);
            setName(dbUser.name);
            setBio(dbUser.bio);
            setGender(dbUser.gender);
            setLookingFor(dbUser.lookingFor);

        };
        getCurrentUser();
    }, []);

    const save = async () => {
        if (!isValid()) {
            console.log('Not Valid');
        }

        let newImage;
        if (newImageLocalUri) {
            newImage = await uploadImage();
        }

        // ------------------------------------------------------------------------------

        if(user) {
            const updatedUser = User.copyOf(user, updated => {
                updated.name = name;
                updated.bio = bio;
                updated.gender = gender;
                updated.lookingFor = lookingFor;
                if (newImage) {
                    updated.image = newImage;
                }
            })

            await DataStore.save(updatedUser).then();
            setNewImageLocalUri(null);

        } else {
            // create a new user
            const authUser = await Auth.currentAuthenticatedUser();

            const newUser = new User({
                sub: authUser.attributes.sub,
                name: name,
                bio: bio,
                gender,
                lookingFor,
                image: 'http://www.svietimonaujienos.lt/wp-content/uploads/2019/12/Rokas-e1575467263326.jpg',
            });

            DataStore.save(newUser).then();
        }

        //------------------------------------------------------------------------------

        Alert.alert("User saved successfully");
    }

    const renderImage = () => {
        if(newImageLocalUri) {
            return (
                    <Image source={{uri: newImageLocalUri}} style={{width: 70, height: 70, borderRadius: 50, marginTop: 10, marginBottom: -40}} />
            )
        }

        if(user?.image?.startsWith('http')){
            return (
                <Image source={{uri: user?.image}} style={{width: 70, height: 70, borderRadius: 50, marginTop: 10, marginBottom: -40}} />
            )
        } else {
            return (
                <S3Image style={{height: 70, width: 70, borderRadius: 50, marginTop: 10, marginBottom: -40}} imgKey={user?.image} />
            )
        }
    }

    //DONE

    return (

        <SafeAreaView>
            <View style={{width: '100%', flexGrow: 1, padding: 10, alignItems: 'center'}}>
               <Text style={tw`text-lg font-bold`}>Profile</Text>
                <TouchableOpacity onPress={signOutFunc}>
                    <Text style={tw`text-xl font-bold text-green-500`}>Sign out</Text>
                </TouchableOpacity>

                <TouchableOpacity onPress={openImagePickerAsync}>
                    {renderImage()}
                </TouchableOpacity>
                <View style={tw`mt-10`}>
                    <TextInput value={name} style={tw`text-lg`} onChangeText={setName} placeholder={'Enter your name'} />
                    <TextInput style={tw`mt-3 text-lg`} multiline numberOfLines={3} value={bio} onChangeText={setBio} placeholder={'Enter your bio'} />
                </View>

                <Text style={tw`mt-10 text-xl font-bold`}>Gender</Text>

                <Picker
                    label="Gender"
                    selectedValue={gender}
                    style={{height:-20, width:400}}
                    onValueChange={(itemValue, itemIndex) =>
                        setGender(itemValue)
                    }>
                    <Picker.Item label="Male" value="MALE" />
                    <Picker.Item label="Female" value="FEMALE" />
                    <Picker.Item label="Other" value="OTHER" />
                </Picker>

                <Text style={tw`text-xl font-bold`}>Looking for</Text>
                <Picker
                    label="Looking for"
                    selectedValue={lookingFor}
                    style={{height:-20, width:400}}
                    onValueChange={(itemValue, itemIndex) =>
                        setLookingFor(itemValue)
                    }>
                    <Picker.Item label="Male" value="MALE" />
                    <Picker.Item label="Female" value="FEMALE" />
                </Picker>



                <TouchableOpacity onPress={save}>
                    <View style={tw`bg-green-500 px-10 mt-4 py-4 rounded-lg`}>
                        <Text style={tw`font-bold`}>Save</Text>
                    </View>
                </TouchableOpacity>

            </View>
        </SafeAreaView>
    );
};

export default ProfileScreen;

const styles = StyleSheet.create({
    user: {
        width: 100,
        height: 100,
        // padding: 8,
        borderWidth: 2,
        borderColor: '#F63A6e',
        borderRadius: 100,
        padding: 4,
    },
    image: {
        width: '100%',
        height: '100%',
        borderRadius: 100,
    },
    users: {
        flexDirection: 'row',
        flexWrap: 'wrap',

    },
});

// backend
