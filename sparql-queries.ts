import { Quad, Quad_Object, Term } from "rdf-js";
import { toString } from "./utils";
import { querySudo as query, updateSudo as update } from "@lblod/mu-auth-sudo";
import { DataFactory } from "n3";
import { prov } from "./namespaces";
const { quad, namedNode, variable } = DataFactory;

const stream = namedNode(process.env.LDES_STREAM);
export async function executeInsertQuery(quads: Quad[]) {
	let triplesString = "";
	quads.forEach((quadObj) => {
		triplesString += toString(quadObj) + "\n";
	});
	const sparql_query = `
    INSERT DATA {
        GRAPH <${process.env.MU_APPLICATION_GRAPH}> {
            ${triplesString}
        }
    }
  `;
	try {
		const response = await update(sparql_query);
		console.log(response);
	} catch (e) {
		console.error(e);
	}
}

export async function executeDeleteQuery(quads: Quad[]) {
	let triplesString = "";
	quads.forEach((quadObj) => {
		triplesString += toString(quadObj) + "\n";
	});
	const sparql_query = `
    DELETE {
      GRAPH <${process.env.MU_APPLICATION_GRAPH}> {
            ${triplesString}
      }
    } WHERE {
        GRAPH <${process.env.MU_APPLICATION_GRAPH}> {
            ${triplesString}
        }
    }
  `;
	console.log(sparql_query);
	try {
		await update(sparql_query);
	} catch (e) {
		console.error(e);
	}
}

export async function getEndTime() {
	const sparql_query = `
    SELECT ?t where {
      GRAPH <${process.env.MU_APPLICATION_GRAPH}> {
        ${toString(stream)} ${toString(prov("endedAtTime"))} ?t.
      }
    }
  `;

	try {
		const response = await query(sparql_query);
		console.log(response);
		if (response.bindings && response.bindings.length) {
			const timeString = response.bindings[0].t.value.split("^^")[0];
			let time: Date = new Date(timeString);
			time.setMilliseconds(time.getMilliseconds() + 1);

			return time;
		}
		return;
	} catch (e) {
		console.error(e);
	}
}

export async function replaceEndTime(timeStamp: Quad_Object) {
	const genericTimeQuad: Quad = quad(
		stream,
		prov("endedAtTime"),
		variable("t")
	);
	await executeDeleteQuery([genericTimeQuad]);
	const newTimeQuad: Quad = quad(stream, prov("endedAtTime"), timeStamp);
	await executeInsertQuery([newTimeQuad]);
}
