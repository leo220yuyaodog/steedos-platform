/*
 * @Author: sunhaolin@hotoa.com
 * @Date: 2023-01-10 17:18:23
 * @LastEditors: sunhaolin@hotoa.com
 * @LastEditTime: 2023-01-14 10:29:56
 * @Description: 
 */
'use strict'

const client = require("../client");

module.exports.up = async function (next) {
    await client.connect()
    const db = client.db()
    const instanceColl = db.collection('instances')
    const tasksColl = db.collection('instance_tasks')
    // 若已有instance_tasks则不执行
    const tasksCount = await tasksColl.find({}).count()
    if (tasksCount > 0) {
        // console.log('[migration]', '库中已有instance_tasks，终止执行。')
        return;
    }
    console.log('[migration] add-instance-tasks is running...')
    await instanceColl.find({}).forEach(async function (insDoc) {
        var docs = [];
        insDoc.traces.forEach(function (tDoc) {
            if (tDoc.approves) {
                tDoc.approves.forEach(function (aDoc) {
                    if (aDoc.type == 'distribute' || aDoc.judge == 'relocated' || aDoc.judge == 'terminated' || aDoc.judge == 'reassigned') {
                        return;
                    }
                    aDoc['space'] = insDoc.space;
                    aDoc['instance_name'] = insDoc.name;
                    aDoc['submitter'] = insDoc.submitter;
                    aDoc['submitter_name'] = insDoc.submitter_name;
                    aDoc['applicant'] = insDoc.applicant;
                    aDoc['applicant_name'] = insDoc.applicant_name;
                    aDoc['applicant_organization_name'] = insDoc.applicant_organization_name;
                    aDoc['submit_date'] = insDoc.submit_date;
                    aDoc['flow'] = insDoc.flow;
                    aDoc['flow_name'] = insDoc.flow_name;
                    aDoc['form'] = insDoc.form;
                    aDoc['step'] = tDoc.step;
                    aDoc['step_name'] = tDoc.name;
                    aDoc['category_name'] = insDoc.category_name;
                    aDoc['instance_state'] = insDoc.state;
                    aDoc['distribute_from_instance'] = insDoc.distribute_from_instance;
                    aDoc['forward_from_instance'] = insDoc.forward_from_instance;
                    aDoc['keywords'] = insDoc.keywords;
                    aDoc['is_archived'] = insDoc.is_archived;
                    aDoc['category'] = insDoc.category;
                    docs.push(aDoc)
                })
            }
        })

        if (docs.length > 0) {
            try {
                await tasksColl.insertMany(docs);
            } catch (e) {
                print(e);
                printjson(docs.length)
            }
        }
    })
    const insCount = await instanceColl.find({}).count()
    const insTasksCount = await tasksColl.find({}).count()
    console.log('[migration] add-instance-tasks successfully ran.', 'instances:', insCount, ', instance_tasks:', insTasksCount)
}

module.exports.down = async function (next) {
    const tasksColl = db.collection('instance_tasks')
    await tasksColl.remove({})
}