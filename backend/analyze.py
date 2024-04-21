from flask import Flask, request, jsonify
#pip install flask-cors
import json 
from flask_cors import CORS
import pandas as pd

app = Flask(__name__)

CORS(app)

def analyze(selectedProjects,epssScore):
    projects = []
    with open("../data/projects.json", "r") as file:
        projects = json.load(file)
    

    projects_analyze = []
    projects_ids = []
    for project in projects:
        if project["name-version"] in selectedProjects:
            projects_analyze.append(project)    
            projects_ids.append(project["id"])
    
    componets =[]
    with open("../data/components.json", "r") as file:
        componets = json.load(file)

    components_analyze = []
    components_ids = []
    for component in componets:
        if component["project_id"] in projects_ids:
            components_analyze.append(component)
            components_ids.append(component["component_id"])

    vulnerabilities = []
    with open("../data/vulnerabilities.json", "r") as file:
        vulnerabilities = json.load(file)

    vulnerabilities_analyze = []
    vulnerabilities_ids = []
    for vulnerability in vulnerabilities:
        if vulnerability["component_id"] in components_ids:
            vulnerabilities_analyze.append(vulnerability)
            vulnerabilities_ids.append(vulnerability["vulnerability_id"])
            

    exploits = []
    with open("../data/exploits.json", "r") as file: 
        exploits = json.load(file)
    
    exploits_analyze = {}
    for vulnerability_id in vulnerabilities_ids:
        if vulnerability_id in exploits: 
            exploits_analyze[vulnerability_id] = exploits[vulnerability_id]
    
    output = { "name": "Dependency Track", "value": 0.0, "children": []  }
    max_value_output = 0.0  

    for project in projects_analyze:
        project_children={"name":project["name-version"], "value": 0.0, "children": []}
        max_value_project = 0.0 
        for component in components_analyze:
            if component["project_id"] == project["id"]:
                component_children={"name":component["component_name"]+"-"+component["component_version"], "value": 0.0, "children": []} 
                max_value_component = 0.0 
                for vulnerability in vulnerabilities_analyze: 
                    if vulnerability["component_id"] == component["component_id"] and vulnerability["epssScore"] > epssScore:    
                        vulnerability_children={"name":vulnerability["vulnerability_id"], "value": vulnerability["epssScore"]} 
                        if vulnerability["epssScore"] > max_value_component:
                            max_value_component = vulnerability["epssScore"]
                        component_children["children"].append(vulnerability_children)

                    
                if max_value_component > max_value_project:
                    max_value_project = max_value_component

                if max_value_component != 0.0: 
                    component_children["value"]=max_value_component
                    project_children["children"].append(component_children)

        if max_value_project != 0.0: 
            project_children["value"] = max_value_project
        
        output["children"].append(project_children)
        if max_value_project > max_value_output:
            max_value_output = max_value_project

    output["value"] = max_value_output
    file_path="../data/circles.json"
    with open(file_path, "w") as json_file:
        json.dump(output, json_file)


    sankey = []
    for project in output["children"]:
        sankey.append({"source":"Dependency Track", "target":project["name"], "value": project["value"]})
        for component in project["children"]:
            sankey.append({"source":project["name"], "target": component["name"],"value":component["value"]})
            for vulnerability in component["children"]: 
                sankey.append({"source":component["name"], "target": vulnerability["name"] ,"value":vulnerability["value"]})
                if vulnerability["name"] in exploits: 
                    for exploit in exploits[vulnerability["name"]]:
                        sankey.append({"source":vulnerability["name"], "target": "exploitdb-id-"+str(exploit) ,"value":vulnerability["value"]})

    file_path="../data/sankey.csv"
    df = pd.DataFrame(sankey)
    df.to_csv(file_path, index=False)


    
# Define a route that accepts GET requests with a parameter
@app.route('/analyze', methods=['GET'])
def api_endpoint():
    # Extract the parameter from the request
    selectedProjects = request.args.get('selectedProjects')
    epssScore = request.args.get('epssScore')

    # Check if the parameter is provided
    if selectedProjects is None or epssScore is None:
        return jsonify({'error': 'Parameters are missing'}), 400

    epssScore = int(epssScore) / 100 

    # Process the parameter and return a response
    response_data = {'message': f'Received parameter: {selectedProjects}'}
    analyze(selectedProjects,epssScore)
    return jsonify(response_data), 200

if __name__ == '__main__':
    app.run(debug=True)
