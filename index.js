/**
 * 建筑物ID，用于登录建筑
 * @type {string}
 */
const BUILDING_ID = 'vd169e72e727480fbd546b33ab22f498';

/**
 * 用户登录，权限获取，得到token和modeDb
 */
getLogin = () => {
    var formdata = new FormData();
    formdata.append("name", "PX4408");
    formdata.append("password", "21635077");

    var requestOptions = {
        method: 'POST',
        body: formdata,
    };

    fetch(`http://building-bos.rickricks.com/bospersonnelservice/${BUILDING_ID}/users/login`, requestOptions)
        .then(response => response.text())
        .then(result => {
            const res = JSON.parse(result);
            console.log("用户登录成功", res);

            // 保存到会话
            sessionStorage.setItem('loginUser', JSON.stringify(res.data.user));
            sessionStorage.setItem('loginExpires', res.data.expires);
            sessionStorage.setItem('token', res.data.access_token);
            sessionStorage.setItem('modelDb', res.data.modelDb);
            return res
        })
        .catch(error => console.log('error', error));
}

/**
 * 根据模型modeCode获取modelKey，用于模型可视化
 * @param modelCode
 */
getModelKeyByModelCode = (modelCode) => {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", sessionStorage.getItem('token'));
    var data = JSON.stringify({
        "condition": [
            {
                "field": "bosclass", "operator": "==", "value": "uoModelDocument", "number": "false", "logic": "And"
            },
            {
                "field": "code", "operator": "==", "value": modelCode, "number": "false", "logic": "And"
            }
        ],
        "select": [
            "modelKey"
        ]
    });
    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: data
    };

    fetch(`http://building-bos.rickricks.com/bosfoundationservice/${BUILDING_ID}/prototype/query/uoModelDocument?noRelation=true`, requestOptions)
        .then(response => response.text())
        .then(result => console.log("得到模型modelKey", JSON.parse(result).data))
        .catch(error => console.log('error', error));
}

/**
 * 根据modelKey和modelDb获得模型树，空间树和专业树的fileKey
 * @param modelKey
 * @param modelDb
 */
queryFileKeyByModelKey = (modelKey, modelDb) =>{
    var myHeaders = new Headers();
    myHeaders.append("Authorization", sessionStorage.getItem('token'));
    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
    };

    fetch(`http://building-bos.rickricks.com/bos3dengine/api/${modelDb}/trees/list?modelKey=${modelKey}`, requestOptions)
        .then(response => response.text())
        .then(result => console.log("得到模型空间树的fileKey", JSON.parse(result).data))
        .catch(error => console.log('error', error));
}

/**
 * 根据fileKey得到模型树JSON对象
 * @param fileKey
 * @returns {string}
 */
queryModelTreeByFileKey = (fileKey) => {
    let treeList = '';
    var settings = {
        "url": `http://building-bos.rickricks.com/bos3dengine/data?fileKey=${fileKey}`,
        "method": "GET",
        'async': false, // 默认是异步请求，这里设置为同步
        "headers": {
            "Authorization": sessionStorage.getItem('token')
        },
    };

    $.ajax(settings).done(function (response) {
        // console.log(response);
        treeList = response;
    });
    // $.ajaxSettings.async = true;
    return treeList;
}


/**
 * 模型可视化
 * @param modelKey
 * @param modelDb
 */
modelViewer = (modelKey, modelDb) => {
    const option = {
        host: "http://building-bos3d.rickricks.com",
        viewport: "viewport",
    };
    window.viewer3D = new BOS3D.Viewer(option);

    // window.bos3dui = new BOS3DUI({ // 工具栏
    //     viewer3D,
    //     BOS3D: BOS3D,
    // });

    viewer3D.addView(modelKey, modelDb);
}

/**
 * 根据itemKey查询关联物项
 * @param itemKey
 */
queryAssociatedItems = (itemKey) =>{
    var data = JSON.stringify({
        "condition": [
            {
                "bosclass": "tags",
                "alias": "bld",
                "subCondition": [
                    {
                        "field": "_key",
                        "operator": "==",
                        "value": itemKey, //物项key
                        "number": "false"
                    }
                ]
            },
            {
                "bosclass": "tags",
                "alias": "tags",
                "subCondition": []
            },
            {
                "bosclass": "uirTagTag",
                "alias": "ubt",
                "type": "relationship",
                "from": "bld",
                "to": "tags",
                "subCondition": []
            }
        ],
        "select": {
            "name": "tags.name",
            "key": "tags._key",
            "attribute": "tags.basicAttribute",
            "code": "tags.code",
            "type": "ubt.type"
        }
    })

    var requestOptions = {
        method: 'POST',
        headers: {
            "Authorization": sessionStorage.getItem('token')
        },
        body: data
    };

    fetch(`http://building-bos.rickricks.com/bosfoundationservice/${BUILDING_ID}/prototype/linked/query?page=1&per_page=10`,
        requestOptions)
        .then(response => response.text())
        .then(result => console.log(JSON.parse(result).data))
        .catch(error => console.log('error', error));
}

/**
 * 根据componentKey获取模型构件绑定的物项
 * @param componentKey
 */
queryItemByComponentKey = (componentKey) => {
    // var requestOptions = {
    //     method: 'GET',
    //     headers: {
    //         "Authorization": sessionStorage.getItem('token')
    //     },
    // };
    //
    // fetch(`http://building-bos.rickricks.com/buildingservice/${BUILDING_ID}/tagModelRel?componentKey=${componentKey}`, requestOptions)
    //     .then(response => response.text())
    //     .then(result => console.log(JSON.parse(result)))
    //     .catch(error => console.log('error', error));

    let itemKey = '';
    var settings = {
        "url": `http://building-bos.rickricks.com/buildingservice/${BUILDING_ID}/tagModelRel?componentKey=${componentKey}`,
        "method": "GET",
        'async': false, // 默认是异步请求，这里设置为同步
        "headers": {
            "Authorization": sessionStorage.getItem('token')
        },
    };

    $.ajax(settings).done(function (response) {
        console.log("得到itemKey", response.data[0].tagKey);
        itemKey = response.data[0].tagKey;
    });
    return itemKey;
}

/**
 * 根据itemKey获取指定物项绑定的构件
 * @param itemKey
 */
queryComponentByItemKey = (itemKey) => {

    // var requestOptions = {
    //     method: 'GET',
    //     headers: {
    //         "Authorization": sessionStorage.getItem('token')
    //     },
    // };
    //
    // fetch(`http://building-bos.rickricks.com/buildingservice/${BUILDING_ID}/tagModelRel?tagKey=${itemKey}`, requestOptions)
    //     .then(response => response.text())
    //     .then(result => console.log("指定物项绑定的模型构件", JSON.parse(result).data))
    //     .catch(error => console.log('error', error));

    let component = '';
    var settings = {
        "url": `http://building-bos.rickricks.com/buildingservice/${BUILDING_ID}/tagModelRel?tagKey=${itemKey}`,
        "method": "GET",
        'async': false, // 默认是异步请求，这里设置为同步
        "headers": {
            "Authorization": sessionStorage.getItem('token')
        },
    };

    $.ajax(settings).done(function (response) {
        console.log("得到itemKey对应的构件", response.data);
        component = response.data;

    });

    return component;
}

/**
 * 获取物项分类树根节点rootKey
 */
queryItemClassRootKey = () => {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", sessionStorage.getItem('token'));
    var data = JSON.stringify({
        "condition": [
            {
                "field": "level",
                "operator": "==",
                "value": "1",
                "number": "true",
                "logic": ""
            },
            {
                "field": "type",
                "operator": "==",
                "value": "item",
                "number": "false",
                "logic": "And"
            }
        ],
        "select": [
            "name"
        ]
    });
    var requestOptions = {
        method: 'POST',
        headers: myHeaders,
        body: data
    };

    fetch(`http://building-bos.rickricks.com/bosfoundationservice/${BUILDING_ID}/prototype/query/uoBldStructures?noRelation=true`,
        requestOptions)
        .then(response => response.text())
        .then(result => console.log(JSON.parse(result).data))
        .catch(error => console.log('error', error));
}

/**
 * 获取指定rootKey的完整物项分类树
 * @param rootKey
 */
queryFullItemClassTree = (rootKey) => {
    var myHeaders = new Headers();
    myHeaders.append("Authorization", sessionStorage.getItem('token'));
    var requestOptions = {
        method: 'GET',
        headers: myHeaders,
    };

    fetch(`http://building-bos.rickricks.com/bosfoundationservice/${BUILDING_ID}/prototype/query/tree/
    uoBldStructures/${rootKey}?type=Child&depth=-1`, requestOptions)
        .then(response => response.text())
        .then(result => console.log(JSON.parse(result)))
        .catch(error => console.log('error', error));
}
